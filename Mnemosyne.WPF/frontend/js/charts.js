(function (global) {
    const MnemosyneCharts = {};
    const resizeObservers = new WeakMap();

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

    function resetChartInstance(element) {
        const existing = echarts.getInstanceByDom(element);
        if (existing) {
            existing.dispose();
        }

        const chart = echarts.init(element);
        bindAutoResize(element, chart);
        requestAnimationFrame(() => chart.resize());
        return chart;
    }

    MnemosyneCharts.renderPlatformPie = function (element, pieData) {
        const chart = resetChartInstance(element);
        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'item' },
            series: [
                {
                    type: 'pie',
                    radius: ['40%', '70%'],
                    itemStyle: {
                        borderRadius: 4,
                        borderColor: '#F4F0EA',
                        borderWidth: 2,
                    },
                    label: {
                        show: true,
                        fontFamily: '"ITC Avant Garde Std", "Source Han Serif CN", serif',
                    },
                    labelLine: {
                        lineStyle: {
                            color: '#7A7A7A',
                        },
                    },
                    data: pieData,
                },
            ],
        });
        return chart;
    };

    MnemosyneCharts.renderMonthlyStackedBar = function (element, rawData, onMonthSelected) {
        const months = [...new Set(rawData.map((item) => item.month))].sort();
        const platforms = [...new Set(rawData.map((item) => item.platform))];

        const series = platforms.map((platform) => {
            return {
                name: platform,
                type: 'bar',
                stack: 'total',
                barMaxWidth: 40,
                data: months.map((month) => {
                    const found = rawData.find((d) => d.month === month && d.platform === platform);
                    return found ? found.totalAmount : 0;
                }),
            };
        });

        const chart = resetChartInstance(element);
        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                backgroundColor: '#F4F0EA',
                borderColor: '#E2DCD0',
                borderWidth: 1,
                padding: 15,
                textStyle: {
                    color: '#1C1C1C',
                    fontFamily: '"ITC Avant Garde Std", "Source Han Serif CN", serif',
                },
                formatter: function (params) {
                    let html = `<div style="font-weight:bold; font-size:1.1rem; margin-bottom:10px;">${params[0].name}</div>`;
                    let monthTotal = 0;

                    params.forEach((p) => {
                        if (p.value === 0) {
                            return;
                        }

                        html += `
                                <div style="display:flex; justify-content:space-between; margin-bottom:5px; min-width: 180px;">
                                    <span style="font-size:0.9rem;">${p.marker} ${p.seriesName}</span>
                                    <span>¥ ${p.value.toFixed(2)}</span>
                                </div>`;
                        monthTotal += p.value;
                    });

                    html += `
                            <div style="border-top:1px dashed #CCC; margin-top:8px; padding-top:8px; display:flex; justify-content:space-between; font-weight:bold;">
                                <span>TOTAL</span>
                                <span>¥ ${monthTotal.toFixed(2)}</span>
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
                    backgroundColor: '#EBE6DE',
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
                    fontFamily: '"ITC Avant Garde Std", "Source Han Serif CN", serif',
                },
            },
            grid: { left: '3%', right: '4%', bottom: '25%', containLabel: true },
            xAxis: {
                type: 'category',
                data: months,
                axisLine: { lineStyle: { color: '#E2DCD0' } },
                axisLabel: { color: '#7A7A7A', fontFamily: 'ITC Avant Garde Std' },
            },
            yAxis: {
                type: 'value',
                splitLine: { lineStyle: { color: '#E2DCD0', type: 'dashed' } },
                axisLabel: { color: '#7A7A7A', fontFamily: 'ITC Avant Garde Std' },
            },
            series: series,
        });

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

    global.MnemosyneCharts = MnemosyneCharts;
    
    // 渲染月度热力图
    MnemosyneCharts.renderMonthHeatmap = function (element, heatmapData, monthStr, maxAmount) {
        const chart = resetChartInstance(element);
        
        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                formatter: function (p) {
                    const value = p.value[1] || 0;
                    return `${p.value[0]}<br/>支出: ¥${value.toFixed(2)}`;
                }
            },
            visualMap: {
                min: 0,
                max: maxAmount || 100,
                type: 'piecewise',
                orient: 'horizontal',
                left: 'center',
                bottom: 0,
                show: true, // 显示图例以对照深浅
                text: ['高', '低'],
                /*
                inRange: {
                    // 使用项目定义的复古配色方案
                    color: ['#E2DCD0', '#B3A894', '#7A7A7A', '#1C1C1C']
                }
                    */
            },
            calendar: {
                top: 40,
                left: 'center',
                // 1. 设置小方格的大小
                cellSize: [15, 15], 
                range: monthStr,
                // 2. 隐藏月份/年份标签，让布局更紧凑
                yearLabel: { show: false },
                monthLabel: { show: false },
                dayLabel: {
                    firstDay: 1,
                    nameMap: ['日', '一', '二', '三', '四', '五', '六'],
                    fontSize: 10,
                    color: '#7A7A7A'
                },
                // 3. 核心：通过 border 控制间距
                itemStyle: {
                    color: '#E2DCD0',
                    borderWidth: 3,       // 增加边框宽度以产生方格间的空隙
                    borderColor: '#F4F0EA', // 边框颜色与页面背景一致
                    borderRadius: 2       // 微小的圆角让方格更像 GitHub
                },
                splitLine: { show: false } // 隐藏大分割线
            },
            series: {
                type: 'heatmap',
                coordinateSystem: 'calendar',
                data: heatmapData
            }
        });
        
        return chart;
    };

})(window);
