// 全局记录等待中的请求
let messageIdCounter = 0;
const pendingRequests = new Map();

// 1. 全局监听来自 C# 的消息回传
if (window.chrome && window.chrome.webview) {
    window.chrome.webview.addEventListener('message', event => {
        // C# 端使用 PostWebMessageAsJson 发送的数据，到这里已经是 JS 对象了
        const response = event.data; 
        
        // 根据返回的 id，找到对应的 Promise 并解除等待状态
        if (response && response.id !== undefined) {
            const handlers = pendingRequests.get(response.id);
            if (handlers) {
                if (response.error) {
                    handlers.reject(new Error(response.error)); // 触发 catch
                } else {
                    handlers.resolve(response.data); // 触发 then 或 await 解锁
                }
                // 请求处理完毕，清理记录
                pendingRequests.delete(response.id);
            }
        } else {
            // 处理 C# 主动推送的消息（如未携带 id 的情况）
            console.log("收到未经请求的 C# 消息:", response);
        }
    });
}

// 2. 封装底层的 WebView2 通信
function requestWPF(action, payload = {}) {
    /*
    action: 字符串，表示要调用的方法名
    payload: 对象，包含要传递给方法的参数
    */
    return new Promise((resolve, reject) => {
        // 兼容性检查：如果在普通浏览器里打开，直接报错提示
        if (!window.chrome || !window.chrome.webview) {
            console.warn(`[模拟模式] 尚未连接 C# 环境，模拟调用: ${action}`);
            reject(new Error("未运行在 WPF WebView2 客户端环境中"));
            return;
        }

        // 生成唯一请求标识
        const id = ++messageIdCounter;
        
        // 把 resolve 和 reject 保存起来，等 C# 返回结果时调用
        pendingRequests.set(id, { resolve, reject });

        // 发送给 C# 的标准数据包
        const message = {
            id: id,
            action: action,
            payload: payload
        };
        
        window.chrome.webview.postMessage(JSON.stringify(message));
    });
}

// 3. 保持业务 API 接口与旧版完全一致！
const api = {
    async getKPI() {
        return await requestWPF('GetKPI');
    },
    
    async getPlatforms() {
        return await requestWPF('GetPlatforms');
    },

    // 获取支出记录列表，支持分页和按月过滤
    async getExpenses(page = 1, pageSize = 10, month = null) {
        // 把 URL 参数转成了 payload 对象
        return await requestWPF('GetExpenses', { page, pageSize, month });
    },

    // 获取每月各平台支出数据（堆叠柱状图）
    async getMonthlyStacked() {
        return await requestWPF('GetMonthlyStacked');
    },

    // 获取指定月份的各平台支出数据
    async getPlatformByMonth(month) {
        return await requestWPF('GetPlatformByMonth', { month });
    },

    // 增加、编辑、删除支出记录
    async addExpense(data) {
        return await requestWPF('AddExpense', data);
    },

    async updateExpense(id, data) {
        // 把 Id 合并进 payload
        return await requestWPF('UpdateExpense', { id: id, ...data });
    },

    async deleteExpense(id) {
        return await requestWPF('DeleteExpense', { id: id });
    },

    async runSQL(query) {
        return await requestWPF('RunSQL', { query });
    }
};

// 导出 api 供其他 js 文件使用（如果你使用了模块化）
// export default api;