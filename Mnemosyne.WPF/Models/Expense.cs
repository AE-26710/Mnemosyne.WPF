using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Mnemosyne.WPF.Models
{
    // 支出项模型类，对应数据库中的 expenses 表
    // 其对象实例表示一笔具体的支出记录
    public class Expense
    {
        public int Id { get; set; }
        public DateOnly ExpenseDate { get; set; }
        public required string Platform { get; set; }
        public double Amount { get; set; }
        public required string ItemName { get; set; }
        public string? Tags { get; set; }
        public List<string> TagsList
        {
            get
            {
                if (string.IsNullOrWhiteSpace(Tags))
                    return new List<string>();

                try
                {
                    return JsonSerializer.Deserialize<List<string>>(Tags);
                }
                catch
                {
                    return new List<string>();
                }
            }
        }
    }
    // 前端发送过来的消息结构
    public class WebRequestPayload
    {
        public int Id { get; set; }
        public required string Action { get; set; }
        public JsonElement Payload { get; set; }
    }
    // 返回给前端的响应结构
    public class WebResponsePayload
    {
        public int Id { get; set; }
        public required string Action { get; set; }
        public object Data { get; set; }
        public string? Error { get; set; }
    }
}
