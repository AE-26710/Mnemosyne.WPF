(function () {
    const { createApp, ref, onMounted, computed } = Vue;
    // 从 utils 中解构详情页需要的函数
    const { 
        formatCurrency, formatDate, getRateClass, sumAmounts, filterByTag, 
        calcGrowthRate, getPreviousMonth, getSameMonthLastYear, getDaysInMonth, 
        buildDailyHeatmapData, toPieData 
    } = MnemosyneUtils;

    createApp({
        setup() {
            const currentMonth = ref('');
            const totalAmount = ref(0);
            const records = ref([]);

            const monthlyTotal = computed(() => {
                return sumAmounts(records.value);
            });

            const fireflyTotal = computed(() => {
                return sumAmounts(filterByTag(records.value, '流萤'));
            });

            const fireflyIndex = computed(() => {
                if (monthlyTotal.value <= 0) return 0;
                return ((fireflyTotal.value / monthlyTotal.value) * 100);
            });

            const lastMonthTotal = ref(0);
            const lastYearSameMonthTotal = ref(0);

            const momRate = computed(() => calcGrowthRate(monthlyTotal.value, lastMonthTotal.value));

            const yoyRate = computed(() => calcGrowthRate(monthlyTotal.value, lastYearSameMonthTotal.value));

            const daysInCurrentMonth = computed(() => {
                return getDaysInMonth(currentMonth.value);
            });

            const dailyAvg = computed(() => {
                if (daysInCurrentMonth.value <= 0) return 0;
                return monthlyTotal.value / daysInCurrentMonth.value;
            });

            const receiptGroups = computed(() => {
                const groups = new Map();

                records.value.forEach((item) => {
                    const platform = item.platform || '未分类';
                    if (!groups.has(platform)) {
                        groups.set(platform, {
                            platform,
                            items: [],
                            subtotal: 0,
                        });
                    }

                    const group = groups.get(platform);
                    const amount = Number(item.amount) || 0;
                    group.items.push(item);
                    group.subtotal += amount;
                });

                return Array.from(groups.values()).sort((a, b) => b.subtotal - a.subtotal);
            });

            const getMonthFromURL = () => {
                const urlParams = new URLSearchParams(window.location.search);
                return urlParams.get('month') || '-';
            };

            const initPieChart = async (month) => {
                try {
                    const json = await api.getPlatformByMonth(month);
                    const pieData = toPieData(json.data);

                    totalAmount.value = pieData.reduce((sum, item) => sum + item.value, 0);

                    const el = document.getElementById('monthPieChart');
                    if (!el) return;
                    MnemosyneCharts.renderPlatformPie(el, pieData);
                } catch (error) {
                    console.error('Failed to initialize pie chart:', error);
                }
            };

            // 新增：初始化热力图的方法
            const initHeatmapChart = (month, recordsData) => {
                const { heatmapData, maxAmount } = buildDailyHeatmapData(recordsData);

                // 3. 触发渲染
                const el = document.getElementById('monthHeatmapChart');
                if (!el) return;
                MnemosyneCharts.renderMonthHeatmap(el, heatmapData, month, maxAmount);
            };

            const fetchRecords = async () => {
                try {
                    const prevMonth = getPreviousMonth(currentMonth.value);
                    const sameMonthLastYear = getSameMonthLastYear(currentMonth.value);

                    const [currentJson, prevJson, lastYearJson] = await Promise.all([
                        api.getExpenses(1, -1, currentMonth.value),
                        prevMonth ? api.getExpenses(1, -1, prevMonth) : Promise.resolve({ data: [] }),
                        sameMonthLastYear ? api.getExpenses(1, -1, sameMonthLastYear) : Promise.resolve({ data: [] }),
                    ]);

                    records.value = currentJson.data || [];
                    lastMonthTotal.value = sumAmounts(prevJson.data || []);
                    lastYearSameMonthTotal.value = sumAmounts(lastYearJson.data || []);

                    if (currentMonth.value && currentMonth.value !== '-') {
                        initHeatmapChart(currentMonth.value, records.value);
                    }
                } catch (error) {
                    console.error('Failed to fetch records:', error);
                }
            };

            onMounted(() => {
                currentMonth.value = getMonthFromURL();
                if (currentMonth.value && currentMonth.value !== '-') {
                    initPieChart(currentMonth.value);
                    fetchRecords();
                }
            });

            return {
                daysInCurrentMonth,
                currentMonth,
                totalAmount,
                records,
                receiptGroups,
                monthlyTotal,
                lastMonthTotal,
                lastYearSameMonthTotal,
                momRate,
                yoyRate,
                dailyAvg,
                fireflyTotal,
                fireflyIndex,
                getRateClass,
                formatCurrency,
                formatDate,
            };
        },
    }).mount('#app');
})();