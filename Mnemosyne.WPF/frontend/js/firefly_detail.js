(function () {
    const { createApp, ref, onMounted, computed } = Vue;

    createApp({
        components: {
            'date-filter': MnemosyneComponents.DateFilter
        },
        setup() {
            const currentYear = new Date().getFullYear();
            const availableYears = ref([currentYear]);
            const selectedYear = ref(currentYear);
            const selectedDate = ref(null);

            const heatmapByYear = ref({});
            const detailsByDate = ref({});
            const monthlyShare = ref([]);

            const heatmapRef = ref(null);
            const shareBarRef = ref(null);

            const dailyDetails = computed(() => {
                if (!selectedDate.value) return [];
                return detailsByDate.value[selectedDate.value] || [];
            });

            const handleDateClick = (date) => {
                selectedDate.value = date;
            };

            const updateHeatMap = () => {
                try {
                    const data = heatmapByYear.value[selectedYear.value] || [];
                    selectedDate.value = null;

                    if (heatmapRef.value) {
                        const chart = MnemosyneCharts.renderFireflyHeatmap(heatmapRef.value, data, selectedYear.value);
                        chart.on('click', (params) => {
                            if (params.data) {
                                handleDateClick(params.data[0]);
                            }
                        });
                    }
                } catch (err) {
                    console.error('加载流萤热力图失败:', err);
                }
            };

            const updateShareChart = () => {
                try {
                    if (!shareBarRef.value) return;
                    MnemosyneCharts.renderFireflySharePercentStackedBar(shareBarRef.value, monthlyShare.value, 48);
                } catch (err) {
                    console.error('加载流萤月度占比图失败:', err);
                }
            };

            const loadFireflyOverview = async () => {
                try {
                    const overview = await api.getFireflyOverview();

                    heatmapByYear.value = overview.heatmapByYear || {};
                    detailsByDate.value = overview.detailsByDate || {};
                    monthlyShare.value = Array.isArray(overview.monthlyShare) ? overview.monthlyShare : [];

                    const years = Array.isArray(overview.years) ? overview.years : [];
                    if (years.length > 0) {
                        availableYears.value = years;
                        selectedYear.value = years[0];
                    }

                    updateHeatMap();
                    updateShareChart();
                } catch (err) {
                    console.error('加载流萤概览失败:', err);
                }
            };

            onMounted(() => {
                loadFireflyOverview();
            });

            return {
                formatCurrency,
                availableYears,
                selectedYear,
                selectedDate,
                dailyDetails,
                heatmapRef,
                shareBarRef,
                fetchData: updateHeatMap
            };
        }
    }).mount('#app');
})();