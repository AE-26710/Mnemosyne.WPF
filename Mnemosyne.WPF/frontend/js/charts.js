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

(function(global) {
    const MnemosyneCharts = {};
    const resizeObservers = new WeakMap();
    const activeCharts = new Set();
    const platformColors = {
        '崩坏：星穹铁道': '#FAC858',
        '崩坏3': '#73C0DE',
        '战争雷霆': '#EE6666',
        'Steam': '#5470C6',
        '明日方舟': '#91CC75',
        'default': '#9E9E9E'
    };

    const rootStyle = getComputedStyle(document.documentElement);
    const bgColor = rootStyle.getPropertyValue('--color-bg').trim();
    const darkBgColor = rootStyle.getPropertyValue('--color-bg-dark').trim();
    const mainTextColor = rootStyle.getPropertyValue('--color-text-main').trim();
    const mutedTextColor = rootStyle.getPropertyValue('--color-text-muted').trim();
    const borderColor = rootStyle.getPropertyValue('--color-border').trim();
    const fireflyColor = rootStyle.getPropertyValue('--color-firefly').trim();
    const fontPrimary = rootStyle.getPropertyValue('--font-primary').trim();

    function getPlatformColor(platformName) {
        return platformColors[platformName] || platformColors['default'];
    }

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

    MnemosyneCharts.renderPlatformPie = function (element, pieData) {
        const chart = resetChartInstance(element);
        chart.setOption({
            backgroundColor: 'transparent',
            tooltip: { 
                trigger: 'item',
                backgroundColor: bgColor,
                borderColor: borderColor,
                borderWidth: 1,
                padding: 15,
                textStyle: {
                    color: mainTextColor,
                    fontFamily: fontPrimary,
                },
                formatter: '<b>{b}</b><br>¥ {c} ({d}%)'
            },
            series: [
                {
                    type: 'pie',
                    radius: ['40%', '70%'],
                    itemStyle: {
                        borderRadius: 4,
                        borderColor: borderColor,
                        borderWidth: 2,
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
                itemStyle: {
                    color: getPlatformColor(platform),
                },
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
                backgroundColor: bgColor,
                borderColor: borderColor,
                borderWidth: 1,
                padding: 15,
                textStyle: {
                    color: mainTextColor,
                    fontFamily: fontPrimary,
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

            grid: { left: '3%', right: '4%', bottom: '25%', containLabel: true },

            xAxis: {
                type: 'category',
                data: months,
                axisLine: { lineStyle: { color: borderColor } },
                axisLabel: { color: mutedTextColor, fontFamily: fontPrimary },
            },

            yAxis: {
                type: 'value',
                splitLine: { lineStyle: { color: borderColor, type: 'dashed' } },
                axisLabel: { color: mainTextColor, fontFamily: fontPrimary },
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

    const fireflyPalette = [
        '#dcefef', // 极浅绿
        '#d4ebeb', // 浅薄荷
        '#8fcaca', // 中薄荷
        '#4ea5a5', // 深青色
        '#2d6060'  // 墨绿色
    ];

    MnemosyneCharts.renderFireflyHeatmap = function (element, heatmapData, year) {
        /*  element: DOM 元素
            heatmap: [{<date>, <amount>}, ...]
            year: string
        */
        const chart = resetChartInstance(element);
    
        const option = {
            backgroundColor: 'transparent',

            tooltip: {
                backgroundColor: bgColor,
                borderColor: borderColor,
                borderWidth: 1,
                textStyle: {
                    color: mainTextColor,
                    fontFamily: fontPrimary,
                },
                formatter: (params) => {
                    return `<b>${params.value[0]}</b><br/>
                            ¥${params.value[1]}</span>`;
                }
            },

            visualMap: {
                type: 'piecewise',
                min: 0,
                max: 2000,
                orient: 'horizontal',
                left: 'center',
                bottom: 20,
                textStyle: { color: mutedTextColor, fontFamily: fontPrimary },
                pieces: [
                    { gt: 0, lte: 50, color: fireflyPalette[1], label: '1-50' },
                    { gt: 50, lte: 200, color: fireflyPalette[2], label: '51-200' },
                    { gt: 200, lte: 648, color: fireflyPalette[3], label: '201-648' },
                    { gt: 648, color: fireflyPalette[4], label: '> 648' }
                ],
                show: true
            },

            calendar: {
                top: 40,
                left: 40,
                right: 40,
                cellSize: ['auto', 22],
                range: year,
                splitLine: { show: false },
                itemStyle: {
                    color: darkBgColor,
                    borderWidth: 4,
                    borderColor: bgColor,
                    borderRadius: 4
                },
                yearLabel: { show: false },
                dayLabel: { 
                    firstDay: 1, 
                    nameMap: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                    color: mutedTextColor,
                    fontFamily: fontPrimary
                },
                monthLabel: { 
                    color: mainTextColor,
                    fontFamily: fontPrimary
                }
            },

            series: {
                type: 'heatmap',
                coordinateSystem: 'calendar',
                data: heatmapData,
            }
        };

        chart.setOption(option);
        return chart;
    };

    global.MnemosyneCharts = MnemosyneCharts;

})(window);
