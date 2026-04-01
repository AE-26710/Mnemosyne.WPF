using Dapper;
using System;
using System.Data;

public class DateOnlyTypeHandler : SqlMapper.TypeHandler<DateOnly>
{
    // 将 .NET 的 DateOnly 写入到数据库 (SQLite 接收格式化后的字符串)
    public override void SetValue(IDbDataParameter parameter, DateOnly value)
    {
        parameter.DbType = DbType.String;
        parameter.Value = value.ToString("yyyy-MM-dd");
    }

    // 将数据库的返回值 (通常是 TEXT) 解析为 .NET 的 DateOnly
    public override DateOnly Parse(object value)
    {
        // 处理 SQLite 返回 TEXT 的情况
        if (value is string stringValue)
        {
            return DateOnly.Parse(stringValue);
        }

        // 兼容某些驱动可能会转成 DateTime 的情况
        if (value is DateTime dateTimeValue)
        {
            return DateOnly.FromDateTime(dateTimeValue);
        }

        throw new ArgumentException($"无法将数据库返回的类型 {value.GetType().FullName} 转换为 DateOnly");
    }
}