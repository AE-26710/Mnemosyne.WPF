/*
ECharts Default Color Palette:
#5470c6	经典深蓝
#91cc75	柔和草绿
#fac858	明亮金黄
#ee6666	珊瑚淡红
#73c0de	天空浅蓝
#3ba272	深薄荷绿
#fc8452	橙红色
#9a60b4	优雅紫色
#ea7ccc	玫瑰粉色
#afb1b7	灰调（备用）
#67727e	深灰蓝（备用）
*/

const { formatCurrency } = MnemosyneUtils;

(function(global) {
    /** @type {Record<string, Function>} 图表渲染函数集合 */
    const MnemosyneCharts = {};
    /** @type {WeakMap<HTMLElement, ResizeObserver>} DOM 与 ResizeObserver 的映射 */
    const resizeObservers = new WeakMap();
    /** @type {Set<echarts.ECharts>} 当前激活的图表实例 */
    const activeCharts = new Set();
    /** @type {Record<string, string>} 平台配色表 */
    const platformColors = {
        '崩坏：星穹铁道': '#FAC858',
        '崩坏3': '#73C0DE',
        '战争雷霆': '#EE6666',
        'Steam': '#5470C6',
        '明日方舟': '#91CC75',
        'default': '#9E9E9E'
    };

    /** @type {CSSStyleDeclaration} 根样式对象 */
    const rootStyle = getComputedStyle(document.documentElement);
    /** @type {string} 页面背景色 */
    const bgColor = rootStyle.getPropertyValue('--color-bg').trim();
    /** @type {string} 深色背景 */
    const darkBgColor = rootStyle.getPropertyValue('--color-bg-dark').trim();
    /** @type {string} 主文本色 */
    const mainTextColor = rootStyle.getPropertyValue('--color-text-main').trim();
    /** @type {string} 次文本色 */
    const mutedTextColor = rootStyle.getPropertyValue('--color-text-muted').trim();
    /** @type {string} 边框色 */
    const borderColor = rootStyle.getPropertyValue('--color-border').trim();
    /** @type {string} 流萤主题色 */
    const fireflyColor = rootStyle.getPropertyValue('--color-firefly').trim();
    /** @type {string} 主字体 */
    const fontPrimary = rootStyle.getPropertyValue('--font-primary').trim();
    /** @type {string} 统一图表左内边距 */
    const chartAreaLeft = 60;
    /** @type {string} 统一图表右内边距 */
    const chartAreaRight = 20;

    /**
     * 获取图表通用基础配置。
     * @returns {echarts.EChartsCoreOption}
     */
    function getChartsOption() {
        return {
            backgroundColor: 'transparent',
            tooltip: {
                backgroundColor: bgColor,
                borderColor: borderColor,
                borderWidth: 1,
                textStyle: {
                    color: mainTextColor,
                    fontFamily: fontPrimary,
                }
            }
        };
    }

    /**
     * 获取 Heatmap 通用基础配置。
     * @param {number|string} year 年份
     * @returns {echarts.EChartsCoreOption}
     */
    function getHeatmapBaseOption(year) {
        const baseOption = getChartsOption();
        const heatmapSpecific = {
            calendar: {
                top: 40,
                left: chartAreaLeft,
                right: chartAreaRight,
                cellSize: ['auto', 22],
                splitLine: { show: false },
                yearLabel: { show: false },
                range: year,
                dayLabel: {
                    firstDay: 1,
                    nameMap: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                    color: mutedTextColor,
                    fontFamily: fontPrimary
                },
                monthLabel: {
                    color: mutedTextColor,
                    fontFamily: fontPrimary
                },
                itemStyle: {
                    color: darkBgColor,
                    borderWidth: 4,
                    borderColor: bgColor,
                    borderRadius: 4
                },
                visualMap: {
                    textStyle: {
                        color: mutedTextColor,
                        fontFamily: fontPrimary,
                    }
                },
            }
        };
        return { ...baseOption, ...heatmapSpecific };
    }

    /**
     * 获取平台颜色。
     * @param {string} platformName 平台名称
     * @returns {string}
     */
    function getPlatformColor(platformName) {
        return platformColors[platformName] || platformColors['default'];
    }

    /**
     * 绑定图表自动 resize 监听。
     * @param {HTMLElement} element 图表容器
     * @param {echarts.ECharts} chart 图表实例
     */
    function bindAutoResize(element, chart) {
        const oldObserver = resizeObservers.get(element);
        if (oldObserver) {
            oldObserver.disconnect();
        }

        const observer = new ResizeObserver(() => {
            chart.resize();
        });

        observer.observe(element);
        resizeObservers.set(element, observer);
    }

    /**
     * 重置并初始化图表实例。
     * @param {HTMLElement} element 图表容器
     * @returns {echarts.ECharts}
     */
    function resetChartInstance(element) {
        const existing = echarts.getInstanceByDom(element);
        if (existing) {
            existing.dispose();
            activeCharts.delete(existing);
        }

        const chart = echarts.init(element);
        bindAutoResize(element, chart);
        requestAnimationFrame(() => chart.resize());
        activeCharts.add(chart);
        return chart;
    }

    window.addEventListener('beforeunload', () => {
        activeCharts.forEach(chart => {
            const el = chart.getDom();
            if (el) {
                const oldObserver = resizeObservers.get(el);
                if (oldObserver) {
                    oldObserver.disconnect();
                    resizeObservers.delete(el);
                }
            }
            chart.dispose();
        });
        activeCharts.clear();
    });

    // 饼图
    MnemosyneCharts.renderPlatformPie = function (element, pieData) {
        const chart = resetChartInstance(element);
        // 获取基类配置
        const baseOption = getChartsOption();
        // 添加特有配置
        const specificOption = {
            tooltip: {
                padding: 15,
                trigger: 'item',
                formatter: (params) => `<b>${params.name}</b><br>¥ ${formatCurrency(params.value)} (${params.percent}%)`
            },
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
                itemStyle: {
                    borderWidth: 0,
                    color: function (params) {
                        return getPlatformColor(params.name);
                    },
                },
                label: {
                    show: true,
                    fontFamily: fontPrimary,
                },
                labelLine: {
                    lineStyle: {
                        color: mutedTextColor,
                    },
                },
                data: pieData,
            }]
        };

        // 合并配置并设置
        chart.setOption(baseOption);
        chart.setOption(specificOption);

        return chart;
    };

    // 月度堆叠柱状图
    /**
     * 渲染月度堆叠柱状图。
     * @param {HTMLElement} element 图表容器
     * @param {Array<{month:string, platform:string, totalAmount:number}>} rawData 原始数据
     * @param {(payload:{month:string, platforms:Array<{name:string,value:number}>, total:number}) => void} [onMonthSelected] 点击月份回调
     * @returns {echarts.ECharts}
     */
    MnemosyneCharts.renderMonthlyStackedBar = function (element, rawData, onMonthSelected) {
        const chart = resetChartInstance(element);
        // 获取基类配置
        const baseOption = getChartsOption();

        const months = [...new Set(rawData.map((item) => item.month))].sort();
        const platforms = [...new Set(rawData.map((item) => item.platform))];

        // 构建每个平台的系列数据
        const series = platforms.map((platform) => {
            return {
                name: platform,
                type: 'bar',
                stack: 'total',
                barMaxWidth: 40,
                itemStyle: {
                    color: getPlatformColor(platform),
                },
                data: months.map((month) => {
                    const found = rawData.find((d) => d.month === month && d.platform === platform);
                    return found ? found.totalAmount : 0;
                }),
                emphasis: {
                    disabled: true
                }
            };
        });

        // 添加特有配置
        const specificOption = {
            tooltip: {
                padding: 15,
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function (params) {
                    let html = `<div style="font-weight:bold; font-size:var(--fs-md); margin-bottom:10px;">${params[0].name}</div>`;
                    let monthTotal = 0;

                    params.forEach((p) => {
                        if (p.value === 0) {
                            return;
                        }

                        html += `
                                <div style="display:flex; justify-content:space-between; margin-bottom:5px; min-width: 180px;">
                                    <span style="font-size:var(--fs-sm);">${p.marker} ${p.seriesName}</span>
                                    <span>¥ ${formatCurrency(p.value)}</span>
                                </div>`;
                        monthTotal += p.value;
                    });

                    html += `
                            <div style="border-top:1px dashed #CCC; margin-top:8px; padding-top:8px; display:flex; justify-content:space-between; font-weight:bold;">
                                <span>TOTAL</span>
                                <span>¥ ${formatCurrency(monthTotal)}</span>
                            </div>`;
                    return html;
                },
            },

            dataZoom: [
                {
                    type: 'inside',
                    startValue: Math.max(0, months.length - 12),
                    endValue: months.length - 1,
                },
                {
                    type: 'slider',
                    show: true,
                    height: 8,
                    bottom: 5,
                    borderColor: 'transparent',
                    backgroundColor: bgColor,
                    fillerColor: '#D3CCC0',
                    handleSize: 0,
                    showDetail: false,
            },
            ],

            legend: {
                bottom: 25,
                icon: 'circle',
                itemGap: 20,
                textStyle: {
                    fontFamily: fontPrimary,
                },
            },

            grid: { 
                left: chartAreaLeft, 
                right: chartAreaRight, 
                bottom: '25%', 
                containLabel: false 
            },

            xAxis: {
                type: 'category',
                data: months,
                axisLine: { lineStyle: { color: borderColor } },
                axisLabel: { color: mutedTextColor, fontFamily: fontPrimary },
            },

            yAxis: {
                type: 'value',
                splitLine: { lineStyle: { color: borderColor, type: 'dashed' } },
                axisLabel: {
                    color: mainTextColor,
                    fontFamily: fontPrimary,
                    formatter: (value) => (value / 100).toFixed(0),
                },
            },

            series: series,
        };

        // 合并配置并设置
        chart.setOption(baseOption);
        chart.setOption(specificOption);

        // 点击事件处理
        const zr = chart.getZr();
        zr.off('click');
        zr.on('click', function (params) {
            const pointInPixel = [params.offsetX, params.offsetY];
            if (!chart.containPixel('grid', pointInPixel)) return;

            const xIndex = chart.convertFromPixel({ seriesIndex: 0 }, pointInPixel)[0];
            const clickedMonth = months[xIndex];
            if (!clickedMonth) return;

            const monthData = rawData.filter((d) => d.month === clickedMonth);
            let total = 0;
            const platformsData = monthData.map((d) => {
                total += d.totalAmount;
                return { name: d.platform, value: d.totalAmount };
            });

            if (typeof onMonthSelected === 'function') {
                onMonthSelected({ month: clickedMonth, platforms: platformsData, total: total });
            }
        });

        return chart;
    };

    /**
     * 渲染流萤占比 100% 堆叠柱状图。
     * @param {HTMLElement} element 图表容器
     * @param {Array<{month:string, fireflyPercent:number, otherPercent:number, fireflyAmount:number, totalAmount:number}>} monthlyShareData 月度占比数据
     * @param {number} [defaultWindow=48] 默认显示窗口（月）
     * @returns {echarts.ECharts}
     */
    MnemosyneCharts.renderFireflySharePercentStackedBar = function (element, monthlyShareData, defaultWindow = 48) {
        const chart = resetChartInstance(element);
        const baseOption = getChartsOption();

        const data = Array.isArray(monthlyShareData) ? monthlyShareData : [];
        const months = data.map((item) => item.month);
        const fireflyData = data.map((item) => item.fireflyPercent || 0);
        const otherData = data.map((item) => item.otherPercent || 0);

        const specificOption = {
            tooltip: {
                padding: 12,
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: (params) => {
                    if (!params || params.length === 0) return '';
                    const month = params[0].name;
                    const row = data.find((item) => item.month === month);
                    const fireflyPercent = row ? row.fireflyPercent || 0 : 0;
                    const otherPercent = row ? row.otherPercent || 0 : 0;
                    const fireflyAmount = row ? row.fireflyAmount || 0 : 0;
                    const totalAmount = row ? row.totalAmount || 0 : 0;

                    return `
                        <div style="font-weight:bold; margin-bottom:6px;">${month}</div>
                        <div style="display:flex; justify-content:space-between; gap:20px; min-width:180px;">
                            <span>流萤占比</span><span>${fireflyPercent.toFixed(2)}%</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; gap:20px; min-width:180px;">
                            <span>其他占比</span><span>${otherPercent.toFixed(2)}%</span>
                        </div>
                        <div style="border-top:1px dashed #CCC; margin-top:8px; padding-top:8px;">
                            <div style="display:flex; justify-content:space-between; gap:20px;"><span>流萤金额</span><span>¥ ${formatCurrency(fireflyAmount)}</span></div>
                            <div style="display:flex; justify-content:space-between; gap:20px;"><span>月总支出</span><span>¥ ${formatCurrency(totalAmount)}</span></div>
                        </div>`;
                }
            },

            legend: {
                bottom: 25,
                icon: 'circle',
                itemGap: 20,
                textStyle: {
                    fontFamily: fontPrimary,
                },
                data: ['流萤', '其他']
            },

            dataZoom: [
                {
                    type: 'inside',
                    startValue: Math.max(0, months.length - defaultWindow),
                    endValue: months.length - 1,
                },
                {
                    type: 'slider',
                    show: true,
                    height: 8,
                    bottom: 5,
                    borderColor: 'transparent',
                    backgroundColor: bgColor,
                    fillerColor: '#D3CCC0',
                    handleSize: 0,
                    showDetail: false,
                },
            ],

            grid: { 
                left: chartAreaLeft, 
                right: chartAreaRight, 
                bottom: '25%', 
                containLabel: false,
            },

            xAxis: {
                type: 'category',
                data: months,
                axisLine: { lineStyle: { color: borderColor } },
                axisLabel: { color: mutedTextColor, fontFamily: fontPrimary },
            },

            yAxis: {
                type: 'value',
                min: 0,
                max: 100,
                splitLine: { lineStyle: { color: borderColor, type: 'dashed' } },
                axisLabel: {
                    color: mutedTextColor,
                    fontFamily: fontPrimary,
                    formatter: (value) => `${value.toFixed(0)}%`,
                },
            },

            series: [
                {
                    emphasis: {
                        disabled: true
                    },
                    name: '流萤',
                    type: 'bar',
                    stack: 'total',
                    barMaxWidth: 40,
                    itemStyle: {
                        color: fireflyColor,
                    },
                    data: fireflyData
                },
                {
                    emphasis: {
                        disabled: true
                    },
                    name: '其他',
                    type: 'bar',
                    stack: 'total',
                    barMaxWidth: 40,
                    itemStyle: {
                        color: darkBgColor,
                    },
                    data: otherData
                }
            ]
        };

        chart.setOption(baseOption);
        chart.setOption(specificOption);

        return chart;
    };

    // 流萤热力图
    /**
     * 渲染流萤热力图。
     * @param {HTMLElement} element 图表容器
     * @param {Array<[string, number]>} heatmapData 热力图数据
     * @param {number|string} year 年份
     * @returns {echarts.ECharts}
     */
    MnemosyneCharts.renderFireflyHeatmap = function (element, heatmapData, year) {
        /*  element: DOM 元素
            heatmap: [{<date>, <amount>}, ...]
            year: string
        */
        const fireflyPalette = [
        '#dcefef', // 极浅绿
        '#d4ebeb', // 浅薄荷
        '#8fcaca', // 中薄荷
        '#4ea5a5', // 深青色
        '#2d6060'  // 墨绿色
        ];

        const chart = resetChartInstance(element);

        // 获取基类配置
        const baseOption = getHeatmapBaseOption(year);

        // 添加特有配置
        const specificOption = {
            tooltip: {
                padding: 8,
                formatter: (params) => {
                    return `<span style="font-weight: 500">${params.value[0]}: ¥ ${formatCurrency(params.value[1])}</span>`;
                }
            },
            visualMap: {
                type: 'piecewise',
                min: 0,
                max: 64800,
                orient: 'horizontal',
                left: 'center',
                bottom: 20,
                text: ['High', 'Low'],
                pieces: [
                    { gt: 0, lte: 6800, color: fireflyPalette[1] },
                    { gt: 6800, lte: 19800, color: fireflyPalette[2] },
                    { gt: 19800, lte: 64800, color: fireflyPalette[3] },
                    { gt: 64800, color: fireflyPalette[4] }
                ],
            },
            series: [{
                type: 'heatmap',
                coordinateSystem: 'calendar',
                data: heatmapData
            }]
        };

        chart.setOption(baseOption);
        chart.setOption(specificOption);
        return chart;
    };

    // 年度热力图
    /**
     * 渲染年度热力图。
     * @param {HTMLElement} element 图表容器
     * @param {Array<[string, number]>} heatmapData 热力图数据
     * @param {number|string} year 年份
     * @returns {echarts.ECharts}
     */
    MnemosyneCharts.renderAnnualHeatmap = function (element, heatmapData, year) {
        const chart = resetChartInstance(element);
        // 获取基类配置
        const baseOption = getHeatmapBaseOption(year);
        // 添加特有配置
        const specificOption = {
            tooltip: {
                padding: 8,
                formatter: (params) => {
                    return `<span style="font-weight: 500">${params.value[0]}: ¥ ${formatCurrency(params.value[1])}</span>`;
                }
            },

            visualMap: {
                type: 'piecewise',
                min: 0,
                max: 200000,
                orient: 'horizontal',
                left: 'center',
                bottom: 20,
                text: ['High', 'Low'],
                pieces: [
                    { gt: 0, lte: 6800, color: '#FFB100' },
                    { gt: 6800, lte: 19800, color:'#FF8C00'  },
                    { gt: 19800, lte: 64800, color: '#F1530E' },
                    { gt: 64800, color: '#E31A1C' }
                ],
            },

            series: [{
                type: 'heatmap',
                coordinateSystem: 'calendar',
                data: heatmapData
            }]
        }

        chart.setOption(baseOption);
        chart.setOption(specificOption);
        return chart;
    }

    // 年度各大平台每月百分比堆叠柱状图
    MnemosyneCharts.renderAnnualPlatformPercentStackedBar = function (element, rawData) {
        const chart = resetChartInstance(element);
        const baseOption = getChartsOption();

        // 固定 12 个月
        const months = Array.from({ length: 12 }, (_, i) => i + 1);
        const platforms = [...new Set(rawData.map((item) => item.platform))];

        // 计算每月总支出
        const monthlyTotals = {};
        months.forEach((m) => {
            monthlyTotals[m] = rawData
                .filter(d => d.month === m)
                .reduce((sum, d) => sum + d.totalAmount, 0);
        });

        // 构建每个平台的系列数据
        const series = platforms.map((platform) => {
            return {
                name: platform,
                type: 'bar',
                stack: 'total',
                barMaxWidth: 30,
                itemStyle: {
                    color: getPlatformColor(platform),
                },
                data: months.map((month) => {
                    const found = rawData.find((d) => d.month === month && d.platform === platform);
                    const amount = found ? found.totalAmount : 0;
                    const total = monthlyTotals[month] || 1; // 避免除以0
                    return amount > 0 ? Number(((amount / total) * 100).toFixed(2)) : 0;
                }),
                emphasis: {
                    disabled: true
                }
            };
        });

        const specificOption = {
            tooltip: {
                padding: 15,
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: function (params) {
                    const month = params[0].name;
                    let html = `<div style="font-weight:bold; font-size:var(--fs-md); margin-bottom:10px;">${month}月</div>`;
                    let monthTotalAmount = monthlyTotals[month] || 0;

                    params.forEach((p) => {
                        if (p.value === 0) return;
                        const platform = p.seriesName;
                        const found = rawData.find(d => d.month === parseInt(month) && d.platform === platform);
                        const amount = found ? found.totalAmount : 0;
                        
                        html += `
                            <div style="display:flex; justify-content:space-between; margin-bottom:5px; min-width: 180px;">
                                <span style="font-size:var(--fs-sm);">${p.marker} ${p.seriesName}</span>
                                <span>${p.value}% (¥ ${formatCurrency(amount)})</span>
                            </div>`;
                    });

                    html += `
                        <div style="border-top:1px dashed #CCC; margin-top:8px; padding-top:8px; display:flex; justify-content:space-between; font-weight:bold;">
                            <span>当月总支出</span>
                            <span>¥ ${formatCurrency(monthTotalAmount)}</span>
                        </div>`;
                    return html;
                },
            },
            legend: {
                bottom: 25,
                icon: 'circle',
                itemGap: 20,
                textStyle: { fontFamily: fontPrimary },
                data: platforms
            },
            grid: { 
                left: chartAreaLeft, 
                right: chartAreaRight, 
                bottom: '25%',
                containLabel: false 
            },
            xAxis: {
                type: 'category',
                data: months.map(m => m.toString()),
                axisLine: { lineStyle: { color: borderColor } },
                axisLabel: { color: mutedTextColor, fontFamily: fontPrimary },
            },
            yAxis: {
                type: 'value',
                max: 100,
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: {
                    lineStyle: { type: 'dashed', color: borderColor, width: 1 },
                },
                axisLabel: {
                    fontFamily: fontPrimary,
                    formatter: '{value}%',
                    color: mutedTextColor,    
                },
            },
            series: series,
        };

        chart.setOption(baseOption);
        chart.setOption(specificOption);
        return chart;
    }

    global.MnemosyneCharts = MnemosyneCharts;

})(window);
