(function () {
    const { createApp, ref, onMounted, computed } = Vue;
    // 从 utils 中解构详情页需要的函数
    const { 
        formatCurrency, getRateClass, sumAmounts, filterByTag, 
        calcGrowthRate, getDaysInMonth, toPieData 
    } = MnemosyneUtils;

    createApp({
        components: {
            'date-filter': MnemosyneComponents.DateFilter
        },
        setup() {
            const currentYear = new Date().getFullYear();
            const startYear = 2022;
            
            /** @type {import('vue').Ref<number[]>} */
            const availableYears = ref(Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i));
            
            /** @type {import('vue').Ref<number>} */
            const selectedYear = ref(currentYear);
            
            /** @type {import('vue').Ref<number>} */
            const selectedMonth = ref(new Date().getMonth() + 1);

            /** @type {import('vue').Ref<string>} */
            const currentMonth = computed(() => {
                const y = selectedYear.value;
                const m = selectedMonth.value.toString().padStart(2, '0');
                return `${y}-${m}`;
            });

            /** @type {import('vue').Ref<number>} */
            const totalAmount = ref(0);
            
            /** @type {import('vue').Ref<Array<any>>} */
            const records = ref([]);

            /** @type {import('vue').ComputedRef<number>} */
            const monthlyTotal = computed(() => sumAmounts(records.value));

            /** @type {import('vue').ComputedRef<number>} */
            const fireflyTotal = computed(() => sumAmounts(filterByTag(records.value, '流萤')));

            /** @type {import('vue').ComputedRef<number>} */
            const fireflyIndex = computed(() => {
                if (monthlyTotal.value <= 0) return 0;
                return ((fireflyTotal.value / monthlyTotal.value) * 100);
            });

            /** @type {import('vue').Ref<number>} */
            const lastMonthTotal = ref(0);
            
            /** @type {import('vue').Ref<number>} */
            const lastYearSameMonthTotal = ref(0);

            /** @type {import('vue').ComputedRef<number>} */
            const momRate = computed(() => calcGrowthRate(monthlyTotal.value, lastMonthTotal.value));

            /** @type {import('vue').ComputedRef<number>} */
            const yoyRate = computed(() => calcGrowthRate(monthlyTotal.value, lastYearSameMonthTotal.value));

            /** @type {import('vue').ComputedRef<number>} */
            const daysInCurrentMonth = computed(() => getDaysInMonth(currentMonth.value));

            /** @type {import('vue').ComputedRef<number>} */
            const dailyAvg = computed(() => {
                if (daysInCurrentMonth.value <= 0) return 0;
                return monthlyTotal.value / daysInCurrentMonth.value;
            });

            /** @type {import('vue').ComputedRef<Array<any>>} */
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

            /**
             * Parse month from URL if exists
             */
            const parseMonthFromURL = () => {
                const urlParams = new URLSearchParams(window.location.search);
                const monthParam = urlParams.get('month');
                if (monthParam && monthParam.length === 7) {
                    const parts = monthParam.split('-');
                    selectedYear.value = parseInt(parts[0], 10);
                    selectedMonth.value = parseInt(parts[1], 10);
                }
            };

            /**
             * Fetch data via dedicated API
             */
            const fetchData = async () => {
                try {
                    const monthStr = currentMonth.value;
                    const result = await api.getMonthDetail(monthStr);

                    records.value = result.records || [];
                    lastMonthTotal.value = result.lastMonthTotal || 0;
                    lastYearSameMonthTotal.value = result.lastYearSameMonthTotal || 0;

                    // Initialize Pie chart if element exists and data provided
                    if (result.platformData) {
                        const pieData = toPieData(result.platformData);
                        totalAmount.value = pieData.reduce((sum, item) => sum + item.value, 0);

                        const el = document.getElementById('monthPieChart');
                        if (el) {
                            MnemosyneCharts.renderPlatformPie(el, pieData);
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch month details:', error);
                }
            };

            onMounted(() => {
                parseMonthFromURL();
                fetchData();
            });

            return {
                availableYears,
                selectedYear,
                selectedMonth,
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
                fetchData
            };
        },
    }).mount('#app');
})();