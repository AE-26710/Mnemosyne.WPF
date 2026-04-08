using Dapper;
using Microsoft.Data.Sqlite;
using Mnemosyne.WPF.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Mnemosyne.WPF.Services
{
    public class ExpenseRepository
    {
        public sealed class PlatformSummaryRow
        {
            public string Platform { get; set; } = string.Empty;
            public long TotalAmount { get; set; }
        }

        public sealed class MonthlyStackedRow
        {
            public string Month { get; set; } = string.Empty;
            public string Platform { get; set; } = string.Empty;
            public long TotalAmount { get; set; }
        }

        // 数据库连接字符串
        private readonly string _connectionString = "Data Source=expenses.db";

        // 综合查询方法
        public (List<Expense> Data, int TotalCount) GetExpenses(
            int page = 1,
            int pageSize = 10,
            DateOnly? startDate = null,
            DateOnly? endDate = null,
            string? platform = null,
            string? tag = null)
        {
            using (var connection = new SqliteConnection(_connectionString))
            {
                // 1. 单独提取 WHERE 语句块，方便给 Count 和 Data 共同使用
                var whereClause = " FROM expenses WHERE 1=1";
                var parameters = new DynamicParameters();

                if (startDate.HasValue)
                {
                    whereClause += " AND ExpenseDate >= @StartDate";
                    parameters.Add("@StartDate", startDate.Value.ToString("yyyy-MM-dd"));
                }
                if (endDate.HasValue)
                {
                    whereClause += " AND ExpenseDate <= @EndDate";
                    parameters.Add("@EndDate", endDate.Value.ToString("yyyy-MM-dd"));
                }
                if (!string.IsNullOrEmpty(platform))
                {
                    whereClause += " AND Platform = @Platform";
                    parameters.Add("@Platform", platform);
                }
                if (!string.IsNullOrEmpty(tag))
                {
                    whereClause += " AND EXISTS (SELECT 1 FROM json_each(Tags) WHERE value = @Tag)";
                    parameters.Add("@Tag", tag);
                }

                // 2. 查询符合条件的总记录数
                var countSql = $"SELECT COUNT(*){whereClause}";
                int totalCount = connection.ExecuteScalar<int>(countSql, parameters);

                // 如果 pageSize == 0，说明前端只想知道总数，不需要查具体数据
                if (pageSize == 0)
                {
                    return (new List<Expense>(), totalCount);
                }

                // 3. 拼接查询具体数据的 SQL
                var selectColumns = "SELECT Id, ExpenseDate, Platform, Amount, ItemName, Tags";
                var dataSql = $"{selectColumns}{whereClause} ORDER BY ExpenseDate DESC";

                // 如果 pageSize != -1，则追加分页限制；如果是 -1 则原样执行（查全部）
                if (pageSize != -1)
                {
                    dataSql += " LIMIT @PageSize OFFSET @Offset";
                    parameters.Add("@PageSize", pageSize);
                    parameters.Add("@Offset", (page - 1) * pageSize);
                }

                var data = connection.Query<Expense>(dataSql, parameters).ToList();

                return (data, totalCount);
            }
        }

        public void AddExpense(Expense expense)
        {
            using (var connection = new SqliteConnection(_connectionString))
            {
                var sql = @"
                    INSERT INTO expenses (ExpenseDate, Platform, Amount, ItemName, Tags) 
                    VALUES (date(@ExpenseDate), @Platform, @Amount, @ItemName, @Tags)";
                connection.Execute(sql, expense);
            }
        }
        public void UpdateExpense(Expense expense)
        {
            using (var connection = new SqliteConnection(_connectionString))
            {
                var sql = @"
            UPDATE expenses 
            SET ExpenseDate = date(@ExpenseDate), Platform = @Platform, 
                Amount = @Amount, ItemName = @ItemName, Tags = @Tags
            WHERE Id = @Id"; // 记得模型里要有 Id 字段
                connection.Execute(sql, expense);
            }
        }

        public void DeleteExpense(int id)
        {
            using (var connection = new SqliteConnection(_connectionString))
            {
                connection.Execute("DELETE FROM expenses WHERE Id = @Id", new { Id = id });
            }
        }
        // --- 图表统计相关 ---

        /// <summary>
        /// 对应原先的 summary_platform_all 和 summary_platform_by_month
        /// </summary>
        public object GetPlatformSummary(string month = null)
        {
            using var connection = new SqliteConnection(_connectionString);
            string sql;
            object param = null;

            if (string.IsNullOrEmpty(month))
            {
                sql = "SELECT Platform, COALESCE(SUM(Amount), 0) as TotalAmount FROM expenses WHERE Amount > 0 GROUP BY Platform";
            }
            else
            {
                sql = "SELECT Platform, COALESCE(SUM(Amount), 0) as TotalAmount FROM expenses WHERE Amount > 0 AND strftime('%Y-%m', ExpenseDate) = @Month GROUP BY Platform";
                param = new { Month = month };
            }

            // Dapper 返回 dynamic 列表，直接就能序列化为 JSON 数组
            var rows = connection.Query<PlatformSummaryRow>(sql, param).ToList();
            return new { Data = rows };
        }

        public object GetMonthlyStackedSummary()
        {
            using var connection = new SqliteConnection(_connectionString);
            var sql = @"
                SELECT strftime('%Y-%m', ExpenseDate) as Month, Platform, COALESCE(SUM(Amount), 0) as TotalAmount
                FROM expenses
                GROUP BY Month, Platform
                ORDER BY Month ASC";

            var rows = connection.Query<MonthlyStackedRow>(sql).ToList();
            return new { Data = rows };
        }

        public object RunReadOnlySql(string query)
        {
            query = query.Trim();
            if (string.IsNullOrEmpty(query)) return new { Status = "error", Message = "SQL query cannot be empty." };

            if (!query.StartsWith("SELECT", StringComparison.OrdinalIgnoreCase) &&
                !query.StartsWith("PRAGMA", StringComparison.OrdinalIgnoreCase))
            {
                return new { Status = "error", Message = "只读模式，仅允许 SELECT 或 PRAGMA 语句。" };
            }

            using var connection = new SqliteConnection(_connectionString);
            try
            {
                // 限制最多 500 行，防止前端卡死
                var limitedQuery = $"SELECT * FROM ({query.TrimEnd(';')}) AS _q LIMIT 500";
                var rows = connection.Query(limitedQuery).ToList();

                // 提取列名并转成 camelCase，便于前端与序列化后的键名匹配
                var columns = rows.Count > 0 ? ((IDictionary<string, object>)rows[0]).Keys.ToList() : new List<string>();
                var camelColumns = columns
                    .Select(col => string.IsNullOrEmpty(col)
                        ? col
                        : char.ToLowerInvariant(col[0]) + col.Substring(1))
                    .ToList();

                return new { Status = "success", Data = rows, Columns = camelColumns, Message = "Showing up to 500 rows." };
            }
            catch (Exception ex)
            {
                return new { Status = "error", Message = ex.Message };
            }
        }

        public object GetKPIStats()
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();

            DateOnly now = DateOnly.FromDateTime(DateTime.Now);
            string displayMonth = now.ToString("yyyy-MM");
            string displayYear = now.ToString("yyyy");
            string lastMonth = now.AddMonths(-1).ToString("yyyy-MM");
            string thisYear = now.ToString("yyyy");
            string lastYear = now.AddYears(-1).ToString("yyyy");

            // 辅助方法：执行单一值的 SUM 查询
            long GetSum(string condition = "", object param = null)
            {
                var sql = $"SELECT SUM(Amount) FROM expenses WHERE Amount > 0 {condition}";
                return connection.ExecuteScalar<long?>(sql, param) ?? 0L;
            }

            long historicalTotal = GetSum();
            long thisMonthTotal = GetSum("AND strftime('%Y-%m', ExpenseDate) = @m", new { m = displayMonth });
            long lastMonthTotal = GetSum("AND strftime('%Y-%m', ExpenseDate) = @m", new { m = lastMonth });
            long thisYearTotal = GetSum("AND strftime('%Y', ExpenseDate) = @y", new { y = thisYear });
            long lastYearTotal = GetSum("AND strftime('%Y', ExpenseDate) = @y", new { y = lastYear });

            // 计算流萤专项支出
            long fireflyTotal = GetSum("AND (ItemName LIKE '%流萤%' OR EXISTS (SELECT 1 FROM json_each(Tags) WHERE value = '流萤'))");

            // 计算各种率
            double momRate = lastMonthTotal > 0 ? ((double)(thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
            double yearYoyRate = lastYearTotal > 0 ? ((double)(thisYearTotal - lastYearTotal) / lastYearTotal) * 100 : 0;
            double fireflyPercent = historicalTotal > 0 ? ((double)fireflyTotal / historicalTotal) * 100 : 0;

            return new
            {
                ServerTime = new
                {
                    DisplayMonth = displayMonth,
                    DisplayYear = displayYear
                },
                HistoricalTotal = historicalTotal,
                ThisMonthTotal = thisMonthTotal,
                LastMonthTotal = lastMonthTotal,
                ThisYearTotal = thisYearTotal,
                LastYearTotal = lastYearTotal,
                MomRate = Math.Round(momRate, 2),
                YearYoyRate = Math.Round(yearYoyRate, 2),
                FireflyTotal = fireflyTotal,
                FireflyPercent = Math.Round(fireflyPercent, 2)
                // (同比 yoy_rate 等可以按同样的逻辑补充)
            };
        }

        public List<Expense> GetAllFireflyExpenses()
        {
            using var connection = new SqliteConnection(_connectionString);
            var sql = @"
                SELECT Id, ExpenseDate, Platform, Amount, ItemName, Tags
                FROM expenses
                WHERE Amount > 0
                  AND (
                    ItemName LIKE '%流萤%'
                    OR EXISTS (SELECT 1 FROM json_each(Tags) WHERE value = '流萤')
                  )
                ORDER BY ExpenseDate DESC, Id DESC";

            return connection.Query<Expense>(sql).ToList();
        }

        public object GetAnnualHeatmap(string year)
        {
            using var connection = new SqliteConnection(_connectionString);
            // 查询指定年份内的所有记录，按天汇总
            var sql = @"
                SELECT ExpenseDate, SUM(Amount) as TotalAmount 
                FROM expenses 
                WHERE strftime('%Y', ExpenseDate) = @Year 
                  AND Amount > 0
                GROUP BY ExpenseDate";
            var rows = connection.Query(sql, new { Year = year }).ToList();
            // ECharts 期望的 [[date, value], ...] 格式
            var chartData = rows.Select(r => new object[] {
                ((IDictionary<string, object>)r)["ExpenseDate"],
                ((IDictionary<string, object>)r)["TotalAmount"]
            }).ToList();
            return chartData;
        }
    }
}
