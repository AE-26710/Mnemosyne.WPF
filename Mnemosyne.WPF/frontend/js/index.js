(function () {
    const { createApp, ref, onMounted } = Vue;
    // 从刚才提取的 utils 中解构需要的工具函数
    // 类似于C++的 using MnemosyneUtils::formatCurrency;
    // 这样就可以直接使用 formatCurrency() 而不是 MnemosyneUtils.formatCurrency()
    const { formatCurrency, getRateClass, toPieData, yuanToCents, centsToYuan } = MnemosyneUtils;
    
    const PLATFORM_OPTIONS = ['Steam', '崩坏：星穹铁道', '崩坏3', '战争雷霆'];

    createApp({
        setup() {
            const kpi = ref({
                historicalTotal: 0,
                thisMonthTotal: 0,
                thisYearTotal: 0,
                momRate: 0,
                yoyRate: 0,
                yearYoyRate: 0,
                lastMonthTotal: 0,
                lastYearTotal: 0,
                fireflyTotal: 0,
                fireflyPercent: 0,
            });

            /**
             * 拉取并刷新仪表盘 KPI 数据。
             * @returns {Promise<void>}
             */
            const fetchKPI = async () => {
                try {
                    kpi.value = await api.getKPI();
                } catch (error) {
                    console.error('Failed to fetch KPI:', error);
                }
            };

            /**
             * 初始化平台分布饼图。
             * @returns {Promise<void>}
             */
            const initPieChart = async () => {
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

            /**
             * 分页加载消费记录。
             * @param {number} [page=1] 目标页码。
             * @returns {Promise<void>}
             */
            const fetchRecords = async (page = 1) => {
                try {
                    const json = await api.getExpenses(page, 10);
                    records.value = json.data;
                    currentPage.value = json.page;
                    totalPages.value = json.totalPages;
                } catch (error) {
                    console.error('Failed to fetch records:', error);
                }
            };

            /**
             * 切换分页到指定页。
             * @param {number} newPage 目标页码。
             * @returns {void}
             */
            const changePage = (newPage) => {
                // 翻页
                if (newPage >= 1 && newPage <= totalPages.value) {
                    fetchRecords(newPage);
                }
            };

            /**
             * 初始化月度堆叠柱状图。
             * @returns {Promise<void>}
             */
            const initBarChart = async () => {
                try {
                    const json = await api.getMonthlyStacked();
                    const rawData = json.data;
                    const el = document.getElementById('barChart');
                    if (!el) return;

                    MnemosyneCharts.renderMonthlyStackedBar(el, rawData);
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

            /**
             * 监听全局按键，匹配密钥后打开 SQL 彩蛋弹窗。
             * @param {KeyboardEvent} e 键盘事件。
             * @returns {void}
             */
            const handleGlobalKeydown = (e) => {
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

            /**
             * 关闭 SQL 弹窗。
             * @returns {void}
             */
            const closeSqlModal = () => {
                showSqlModal.value = false;
            };

            /**
             * 执行 SQL 语句并更新结果展示区域。
             * @returns {Promise<void>}
             */
            const executeSql = async () => {
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

            /**
             * 打开新增记录表单，并预填当前日期。
             * @returns {void}
             */
            const openForm = () => {
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

            /**
             * 打开编辑表单并回填记录数据。
             * @param {{ id: number, expenseDate?: string, itemName: string, platform: string, amount: number, tagsList?: string[] }} item 记录项。
             * @returns {void}
             */
            const editItem = (item) => {
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
                    amount: formatCurrency(item.amount),
                    tagsInput: item.tagsList ? item.tagsList.join(',') : '',
                };

                selectedPlatform.value = PLATFORM_OPTIONS.includes(item.platform) ? item.platform : '__custom__';
                showModal.value = true;
            };

            /**
             * 处理平台下拉框变更，支持自定义平台输入。
             * @returns {void}
             */
            const onPlatformChange = () => {
                if (selectedPlatform.value === '__custom__') {
                    if (PLATFORM_OPTIONS.includes(formData.value.platform)) {
                        formData.value.platform = '';
                    }
                } else {
                    formData.value.platform = selectedPlatform.value;
                }
            };

            /**
             * 关闭新增/编辑表单。
             * @returns {void}
             */
            const closeForm = () => {
                showModal.value = false;
            };

            /**
             * 校验表单并提交新增或更新请求。
             * @returns {Promise<void>}
             */
            const submitForm = async () => {
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
                    amount: yuanToCents(formData.value.amount),
                    tags: formData.value.tagsInput
                        ? formData.value.tagsInput
                                .split(',')
                                .map((t) => t.trim())
                                .filter((t) => t)
                        : [],
                };

                if (!Number.isFinite(payload.amount)) {
                    alert('请输入有效金额！');
                    return;
                }

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

            /**
             * 进入删除确认状态。
             * @param {number} id 目标记录 ID。
             * @returns {Promise<void>}
             */
            const deleteItem = async (id) => {
                pendingDeleteId.value = id;
                showDeleteConfirm.value = true;
            };

            /**
             * 关闭删除确认弹窗。
             * @returns {void}
             */
            const closeDeleteConfirm = () => {
                showDeleteConfirm.value = false;
                pendingDeleteId.value = null;
            };

            /**
             * 确认删除选中的记录。
             * @returns {Promise<void>}
             */
            const confirmDelete = async () => {
                if (pendingDeleteId.value == null) return;
                try {
                    await api.deleteExpense(pendingDeleteId.value);
                    closeDeleteConfirm();
                    refreshAllData();
                } catch (e) {
                    alert('删除失败: ' + e.message);
                }
            };

            /**
             * 跳转到当前月份的明细页。
             * @returns {void}
             */
            const goToCurrentMonthDetail = () => {
                const monthStr = kpi.value.serverTime?.displayMonth;
                if (monthStr) {
                    window.location.href = `month_detail.html?month=${monthStr}`;
                }
            };

            /**
             * 跳转到当前年份的明细页。
             * @returns {void}
             */
            const goToCurrentYearDetail = () => {
                const yearStr = kpi.value.serverTime?.displayYear;
                if (yearStr) {
                    window.location.href = `year_detail.html?year=${yearStr}`;
                }
            };

            /**
             * 跳转到流萤明细页。
             * @returns {void}
             */
            const goToFireflyDetail = () => {
                window.location.href = 'firefly_detail.html';
            };

            /**
             * 刷新仪表盘全部数据，包括 KPI、图表和列表。
             * @returns {void}
             */
            const refreshAllData = () => {
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
                goToFireflyDetail
            };
        },
    }).mount('#app');
})();