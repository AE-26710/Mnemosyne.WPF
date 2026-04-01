(function () {
    const { createApp, ref, onMounted } = Vue;
    // 从刚才提取的 utils 中解构需要的工具函数
    // 类似于C++的 using MnemosyneUtils::formatCurrency;
    // 这样就可以直接使用 formatCurrency() 而不是 MnemosyneUtils.formatCurrency()
    const { formatCurrency, formatDate, getRateClass, toPieData } = MnemosyneUtils;
    
    const PLATFORM_OPTIONS = ['Steam', '崩坏：星穹铁道', '崩坏3', '战争雷霆'];

    createApp({
        setup() {
            const kpi = ref({
                historicalTotal: 0,
                thisMonth: 0,
                thisYear: 0,
                momRate: 0,
                yoyRate: 0,
                yearYoyRate: 0,
                lastMonthTotal: 0,
                lastYearTotal: 0,
                fireflyTotal: 0,
                fireflyPercent: 0,
            });

            const fetchKPI = async () => {
                // 获取 KPI 指标数据并填充仪表盘
                try {
                    kpi.value = await api.getKPI();
                } catch (error) {
                    console.error('Failed to fetch KPI:', error);
                }
            };

            const initPieChart = async () => {
                // 初始化平台分布饼图
                try {
                    const json = await api.getPlatforms();
                    const pieData = toPieData(json.data);

                    const el = document.getElementById('pieChart');
                    if (!el) return;
                    MnemosyneCharts.renderPlatformPie(el, pieData);
                } catch (error) {
                    console.error('Failed to initialize pie chart:', error);
                }
            };

            const records = ref([]);
            const currentPage = ref(1);
            const totalPages = ref(1);

            const fetchRecords = async (page = 1) => {
                // 分页获取消费记录
                try {
                    const json = await api.getExpenses(page, 10);
                    records.value = json.data;
                    currentPage.value = json.page;
                    totalPages.value = json.totalPages;
                } catch (error) {
                    console.error('Failed to fetch records:', error);
                }
            };

            const changePage = (newPage) => {
                // 翻页
                if (newPage >= 1 && newPage <= totalPages.value) {
                    fetchRecords(newPage);
                }
            };

            const selectedMonth = ref(null);

            const initBarChart = async () => {
                // 初始化月度堆叠柱状图
                try {
                    const json = await api.getMonthlyStacked();
                    const rawData = json.data;
                    const el = document.getElementById('barChart');
                    if (!el) return;

                    MnemosyneCharts.renderMonthlyStackedBar(el, rawData, (monthInfo) => {
                        selectedMonth.value = monthInfo;
                    });
                } catch (error) {
                    console.error('Failed to initialize bar chart:', error);
                }
            };

            const showModal = ref(false);
            const isEditing = ref(false);
            const editingId = ref(null);
            const selectedPlatform = ref(PLATFORM_OPTIONS[0]);
            const showDeleteConfirm = ref(false);
            const pendingDeleteId = ref(null);

            const secretSequence = 'RmlyZWZseQ==';
            let currentSequence = '';
            const showSqlModal = ref(false);
            const sqlQuery = ref('SELECT * FROM expenses ORDER BY id DESC LIMIT 5;');
            const sqlResult = ref(null);
            const sqlColumns = ref([]);
            const sqlError = ref('');
            const sqlSuccessMessage = ref('');

            const handleGlobalKeydown = (e) => {
                // 监听全局按键触发 SQL 彩蛋
                if (e.key.length === 1 || e.key === '=') {
                    currentSequence += e.key;
                    if (currentSequence.length > secretSequence.length) {
                        currentSequence = currentSequence.substring(currentSequence.length - secretSequence.length);
                    }
                    if (currentSequence === secretSequence) {
                        showSqlModal.value = true;
                        sqlResult.value = null;
                        sqlError.value = '';
                        sqlSuccessMessage.value = '';
                        currentSequence = '';
                    }
                }
            };

            const closeSqlModal = () => {
                // 关闭 SQL 弹窗
                showSqlModal.value = false;
            };

            const executeSql = async () => {
                // 执行 SQL 并渲染结果表格
                sqlError.value = '';
                sqlSuccessMessage.value = '';
                sqlResult.value = null;
                sqlColumns.value = [];

                if (!sqlQuery.value.trim()) return;

                try {
                    const res = await api.runSQL(sqlQuery.value);
                    if (res.status === 'success') {
                        if (res.data) {
                            sqlResult.value = res.data;
                            sqlColumns.value = res.columns || [];
                        } else {
                            sqlSuccessMessage.value = res.message;
                            refreshAllData();
                        }
                    } else {
                        sqlError.value = res.message || 'Unknown error occurred';
                    }
                } catch (e) {
                    sqlError.value = e.message;
                }
            };

            const formDate = ref({ year: '', month: '', day: '' });
            const formData = ref({ itemName: '', platform: '', amount: '', tagsInput: '' });

            const openForm = () => {
                // 打开新增表单并预填今天日期
                isEditing.value = false;
                editingId.value = null;

                const today = new Date();
                formDate.value = {
                    year: today.getFullYear().toString(),
                    month: String(today.getMonth() + 1).padStart(2, '0'),
                    day: String(today.getDate()).padStart(2, '0'),
                };

                formData.value = {
                    itemName: '',
                    platform: PLATFORM_OPTIONS[0],
                    amount: '',
                    tagsInput: '',
                };
                selectedPlatform.value = PLATFORM_OPTIONS[0];
                showModal.value = true;
            };

            const editItem = (item) => {
                // 打开编辑表单并填充选中记录
                isEditing.value = true;
                editingId.value = item.id;

                let y = '',
                    m = '',
                    d = '';
                if (item.expenseDate) {
                    const parts = item.expenseDate.split('-');
                    if (parts.length === 3) {
                        [y, m, d] = parts;
                    }
                }
                formDate.value = { year: y, month: m, day: d };

                formData.value = {
                    itemName: item.itemName,
                    platform: item.platform,
                    amount: item.amount,
                    tagsInput: item.tagsList ? item.tagsList.join(',') : '',
                };

                selectedPlatform.value = PLATFORM_OPTIONS.includes(item.platform) ? item.platform : '__custom__';
                showModal.value = true;
            };

            const onPlatformChange = () => {
                // 平台选择变化时处理自定义输入
                if (selectedPlatform.value === '__custom__') {
                    if (PLATFORM_OPTIONS.includes(formData.value.platform)) {
                        formData.value.platform = '';
                    }
                } else {
                    formData.value.platform = selectedPlatform.value;
                }
            };

            const closeForm = () => {
                // 关闭表单
                showModal.value = false;
            };

            const submitForm = async () => {
                // 校验并提交表单，新增或更新记录
                const strY = formDate.value.year;
                const strM = formDate.value.month;
                const strD = formDate.value.day;

                if (!strY || !strM || !strD || isNaN(strY) || isNaN(strM) || isNaN(strD)) {
                    alert('请输入有效的年月日数字！');
                    return;
                }

                const y = parseInt(strY, 10);
                const m = parseInt(strM, 10);
                const d = parseInt(strD, 10);

                const dateObj = new Date(y, m - 1, d);
                if (dateObj.getFullYear() !== y || dateObj.getMonth() + 1 !== m || dateObj.getDate() !== d) {
                    alert('请输入正确有效的日期！');
                    return;
                }

                const finalDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

                const payload = {
                    expenseDate: finalDate,
                    itemName: formData.value.itemName,
                    platform: formData.value.platform,
                    amount: parseFloat(formData.value.amount),
                    tags: formData.value.tagsInput
                        ? formData.value.tagsInput
                                .split(',')
                                .map((t) => t.trim())
                                .filter((t) => t)
                        : [],
                };

                try {
                    if (isEditing.value) {
                        await api.updateExpense(editingId.value, payload);
                    } else {
                        await api.addExpense(payload);
                    }
                    closeForm();
                    refreshAllData();
                } catch (e) {
                    alert('保存失败: ' + e.message);
                }
            };

            const deleteItem = async (id) => {
                // 弹出删除确认框
                pendingDeleteId.value = id;
                showDeleteConfirm.value = true;
            };

            const closeDeleteConfirm = () => {
                // 关闭删除确认
                showDeleteConfirm.value = false;
                pendingDeleteId.value = null;
            };

            const confirmDelete = async () => {
                // 确认删除记录
                if (pendingDeleteId.value == null) return;
                try {
                    await api.deleteExpense(pendingDeleteId.value);
                    closeDeleteConfirm();
                    refreshAllData();
                } catch (e) {
                    alert('删除失败: ' + e.message);
                }
            };

            const goToCurrentMonthDetail = () => {
                // 跳转到当前月份明细页
                const monthStr = kpi.value.serverTime?.displayMonth;
                if (monthStr) {
                    window.location.href = `month_detail.html?month=${monthStr}`;
                }
            };

            const goToCurrentYearDetail = () => {
                // 跳转到当前年份明细页
                const yearStr = kpi.value.serverTime?.displayYear;
                if (yearStr) {
                    window.location.href = `year_detail.html?year=${yearStr}`;
                }
            };

            const refreshAllData = () => {
                // 刷新全部数据和图表
                fetchKPI();
                initPieChart();
                initBarChart();
                fetchRecords(currentPage.value);
            };

            onMounted(() => {
                fetchKPI();
                initPieChart();
                initBarChart();
                fetchRecords(1);
                window.addEventListener('keydown', handleGlobalKeydown);
            });

            return {
                kpi,
                records,
                currentPage,
                totalPages,
                changePage,
                getRateClass,
                formatCurrency,
                formatDate,
                selectedMonth,
                showModal,
                isEditing,
                editingId,
                formDate,
                formData,
                platformOptions: PLATFORM_OPTIONS,
                selectedPlatform,
                showDeleteConfirm,
                openForm,
                editItem,
                closeForm,
                onPlatformChange,
                submitForm,
                deleteItem,
                closeDeleteConfirm,
                confirmDelete,
                refreshAllData,
                showSqlModal,
                sqlQuery,
                sqlResult,
                sqlColumns,
                sqlError,
                sqlSuccessMessage,
                closeSqlModal,
                executeSql,
                goToCurrentMonthDetail,
                goToCurrentYearDetail,
            };
        },
    }).mount('#app');
})();