using Dapper;
using Microsoft.Data.Sqlite;
using Microsoft.Web.WebView2.Core;
using Mnemosyne.WPF.Models;
using Mnemosyne.WPF.Services;
using System.Globalization;
using System.IO;
using System.Text.Json;
using System.Windows;

namespace Mnemosyne.WPF
{
	public partial class MainWindow : Window
	{
		private readonly string _connectionString =
		$"Data Source={Path.Combine(System.AppDomain.CurrentDomain.BaseDirectory, "expenses.db")}";

		private ExpenseRepository _repo = new ExpenseRepository();
		
		private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
		{
			PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
			DictionaryKeyPolicy = JsonNamingPolicy.CamelCase,
			PropertyNameCaseInsensitive = true
		};
		

		public MainWindow()
		{
			SqlMapper.AddTypeHandler(new DateOnlyTypeHandler());
			InitializeComponent();
			InitializeWebViewAsync();
		}

		private async void InitializeWebViewAsync()
		{
			await MainWebView.EnsureCoreWebView2Async(null);
			MainWebView.CoreWebView2.WebMessageReceived += CoreWebView2_WebMessageReceived;

			var frontendDir = Path.Combine(AppContext.BaseDirectory, "frontend");
			var indexFile = Path.Combine(frontendDir, "index.html");

			if (!File.Exists(indexFile))
			{
				MessageBox.Show($"前端文件不存在：\n{indexFile}", "资源缺失", MessageBoxButton.OK, MessageBoxImage.Error);
				return;
			}

			MainWebView.CoreWebView2.SetVirtualHostNameToFolderMapping(
				"app.localhost",
				frontendDir,
				CoreWebView2HostResourceAccessKind.Allow);

			MainWebView.CoreWebView2.Navigate("https://app.localhost/index.html");

#if DEBUG
			MainWebView.CoreWebView2.OpenDevToolsWindow();
#endif
		}

		private void CoreWebView2_WebMessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs e)
		{
			string jsonFromJs = e.TryGetWebMessageAsString();
			var request = JsonSerializer.Deserialize<WebRequestPayload>(jsonFromJs, _jsonOptions)
				?? throw new InvalidOperationException("无效的请求数据");

			var response = new WebResponsePayload
			{
				Id = request.Id,
				Action = request.Action + "Result"
			};

			try
			{
				switch (request.Action)
				{
					// 列表与基础查询
					case "GetExpenses":
						response.Data = HandleGetExpenses(request.Payload);
						break;

					// 增删改
					case "AddExpense":
						response.Data = HandleAddExpense(request.Payload);
						break;
					case "UpdateExpense":
						response.Data = HandleUpdateExpense(request.Payload);
						break;
					case "DeleteExpense":
						response.Data = HandleDeleteExpense(request.Payload);
						break;

					// 图表与数据面板 (KPI)
					case "GetKPI":
						response.Data = _repo.GetKPIStats(); // 直接调用 Repo
						break;
					case "GetPlatforms":
						response.Data = _repo.GetPlatformSummary(null);
						break;
					case "GetPlatformByMonth":
						string pMonth = request.Payload.TryGetProperty("month", out var pm) ? pm.GetString() : null;
						response.Data = _repo.GetPlatformSummary(pMonth);
						break;
					case "GetMonthlyStacked":
						response.Data = _repo.GetMonthlyStackedSummary();
						break;
					case "RunSQL":
						string sql = request.Payload.TryGetProperty("query", out var q) ? q.GetString() : "";
						response.Data = _repo.RunReadOnlySql(sql);
						break;
					case "GetFireflyHeatmap":
						string year = request.Payload.TryGetProperty("year", out var yr) ? yr.ToString() : DateTime.Now.Year.ToString();
						response.Data = _repo.GetFireflyAnnualHeatmap(year);
						break;
					case "GetAnnualHeatmap":
                        string aYear = request.Payload.TryGetProperty("year", out var ay) ? ay.ToString() : DateTime.Now.Year.ToString();
						response.Data = _repo.GetAnnualHeatmap(aYear);
                        break;
                    default:
						throw new Exception($"未知的 API Action: {request.Action}");
				}
			}
			// 如果出错，把错误信息装入 error 字段，前端 Promise 的 reject 会捕获它
			catch (Exception ex)
			{
				response.Error = ex.Message;
			}

			string responseJson = JsonSerializer.Serialize(response, _jsonOptions);
			MainWebView.CoreWebView2.PostWebMessageAsJson(responseJson);
		}

		private object HandleGetExpenses(JsonElement payload)
		{
			int page = payload.TryGetProperty("page", out var p) ? p.GetInt32() : -1;
			int pageSize = payload.TryGetProperty("pageSize", out var ps) ? ps.GetInt32() : -1;
			string? month = payload.TryGetProperty("month", out var m) ? m.GetString() : null;

			DateOnly? startDate = null;
			DateOnly? endDate = null;

			if (!string.IsNullOrEmpty(month) && month.Length == 7)
			{
				startDate = DateOnly.Parse(month + "-01");
				endDate = startDate.Value.AddMonths(1).AddDays(-1);
			}

			var expensesList = _repo.GetExpenses(page, pageSize, startDate, endDate, null, null);

			int totalPages = pageSize > 0 ? (int)Math.Ceiling(expensesList.TotalCount / (double)pageSize) : 1;

			return new
			{
				Total = expensesList.TotalCount,
				Page = page,
				PageSize = pageSize,
				TotalPages = totalPages,
				Data = expensesList.Data
			};
		}

		// 解析前端传来的日期字符串，支持 "yyyy-MM-dd" 和 ISO 8601 两种格式
		private static DateOnly ParsePayloadDate(JsonElement payload, string propertyName)
		{
			if (!payload.TryGetProperty(propertyName, out var dateEl))
				throw new ArgumentException($"缺少字段: {propertyName}");

			var dateText = dateEl.GetString();
			if (string.IsNullOrWhiteSpace(dateText))
				throw new ArgumentException($"字段为空: {propertyName}");

			// 例如前端传 "2026-03-30"
			if (DateOnly.TryParseExact(
				dateText,
				"yyyy-MM-dd",
				CultureInfo.InvariantCulture,
				DateTimeStyles.None,
				out var date))
			{
				return date;
			}

			/* 兜底：兼容 ISO 8601
			if (DateTime.TryParse(dateText, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out date))
			{
				return date;
			}*/

			throw new ArgumentException($"日期格式无效: {propertyName}={dateText}");
		}

		private object HandleAddExpense(JsonElement payload)
		{
			var expense = new Expense
			{
				ExpenseDate = ParsePayloadDate(payload, "expenseDate"),
				ItemName = payload.GetProperty("itemName").GetString(),
				Platform = payload.GetProperty("platform").GetString(),
             Amount = ParsePayloadAmountInCents(payload, "amount"),
				Tags = payload.GetProperty("tags").GetRawText()
			};

			_repo.AddExpense(expense);
			return new { Ok = true };
		}

		private object HandleUpdateExpense(JsonElement payload)
		{
			var expense = new Expense
			{
				Id = payload.GetProperty("id").GetInt32(), // Update 多了一个 Id
				ExpenseDate = ParsePayloadDate(payload, "expenseDate"),
				ItemName = payload.GetProperty("itemName").GetString(),
				Platform = payload.GetProperty("platform").GetString(),
             Amount = ParsePayloadAmountInCents(payload, "amount"),
				Tags = payload.GetProperty("tags").GetRawText()
			};

			_repo.UpdateExpense(expense);
			return new { Status = "success" };
		}

		private object HandleDeleteExpense(JsonElement payload)
		{
			int id = payload.GetProperty("id").GetInt32();
			_repo.DeleteExpense(id);
			return new { Status = "success" };
		}

		private static long ParsePayloadAmountInCents(JsonElement payload, string propertyName)
		{
			if (!payload.TryGetProperty(propertyName, out var amountEl))
				throw new ArgumentException($"缺少字段: {propertyName}");

			if (amountEl.ValueKind == JsonValueKind.Number)
			{
				if (amountEl.TryGetInt64(out var amountInCents))
				{
					return amountInCents;
				}

				var amountInYuan = amountEl.GetDecimal();
				return (long)Math.Round(amountInYuan * 100m, MidpointRounding.AwayFromZero);
			}

			if (amountEl.ValueKind == JsonValueKind.String)
			{
				var rawText = amountEl.GetString();
				if (long.TryParse(rawText, out var amountInCents))
				{
					return amountInCents;
				}

				if (decimal.TryParse(rawText, NumberStyles.Number, CultureInfo.InvariantCulture, out var amountInYuan))
				{
					return (long)Math.Round(amountInYuan * 100m, MidpointRounding.AwayFromZero);
				}
			}

			throw new ArgumentException($"金额格式无效: {propertyName}");
		}
	}
}