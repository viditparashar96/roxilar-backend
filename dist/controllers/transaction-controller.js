"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCombinedData = exports.getPieChartData = exports.getBarChartData = exports.getStatistics = exports.getTransactions = void 0;
const axios_1 = __importDefault(require("axios"));
const console_1 = __importDefault(require("console"));
const env_config_1 = require("../config/env-config");
const transaction_model_1 = __importDefault(require("../models/transaction-model"));
const baseUrl = env_config_1.env_conf.node_env === "dev"
    ? `http://localhost:${process.env.PORT}/api/v1/transaction`
    : ""; // Adjust the base URL if needed
const getTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const params = req.query;
        const page = parseInt(params.page, 10) || 1;
        const perPage = parseInt(params.per_page, 10) || 10;
        const search = params.search || "";
        const transactionMonth = params.transactionMonth || "All";
        console_1.default.log("search==>", typeof search);
        const isNumber = !isNaN(Number(search));
        console_1.default.log("isNumber===>", isNumber);
        let searchQuery = search
            ? {
                $or: [
                    { title: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } },
                    { category: { $regex: search, $options: "i" } },
                    { price: isNumber ? Number(search) : null },
                ],
            }
            : {};
        if (transactionMonth !== "All") {
            const monthQuery = {
                $expr: {
                    $eq: [
                        { $month: { $dateFromString: { dateString: "$dateOfSale" } } },
                        parseInt(transactionMonth, 10),
                    ],
                },
            };
            searchQuery = Object.assign(Object.assign({}, searchQuery), monthQuery);
        }
        const transactions = yield transaction_model_1.default.find(searchQuery)
            .skip((page - 1) * perPage)
            .limit(perPage);
        const totalTransactions = yield transaction_model_1.default.countDocuments(searchQuery);
        res.status(200).json({
            transactions,
            pagination: {
                page,
                perPage,
                totalPages: Math.ceil(totalTransactions / perPage),
                totalTransactions,
            },
        });
    }
    catch (error) {
        console_1.default.error(error);
        res
            .status(500)
            .json({ message: "An error occurred while fetching transactions." });
    }
});
exports.getTransactions = getTransactions;
const getStatistics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { month } = req.query;
        if (!month) {
            return res
                .status(400)
                .json({ message: "Month is a required parameter." });
        }
        const parsedMonth = month !== "All" ? parseInt(month, 10) : null;
        if (parsedMonth !== null &&
            (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12)) {
            return res.status(400).json({ message: "Invalid month format." });
        }
        const aggregationPipeline = [
            {
                $addFields: {
                    monthOfSale: {
                        $month: { $dateFromString: { dateString: "$dateOfSale" } },
                    },
                },
            },
        ];
        if (parsedMonth !== null) {
            aggregationPipeline.push({
                $match: {
                    monthOfSale: parsedMonth,
                },
            });
        }
        aggregationPipeline.push({
            $group: {
                _id: null,
                totalSaleAmount: { $sum: "$price" },
                totalSoldItems: { $sum: { $cond: [{ $eq: ["$sold", true] }, 1, 0] } },
                totalNotSoldItems: {
                    $sum: { $cond: [{ $eq: ["$sold", false] }, 1, 0] },
                },
            },
        });
        const [statistics] = yield transaction_model_1.default.aggregate(aggregationPipeline).exec();
        res.status(200).json({
            totalSaleAmount: statistics ? statistics.totalSaleAmount : 0,
            totalSoldItems: statistics ? statistics.totalSoldItems : 0,
            totalNotSoldItems: statistics ? statistics.totalNotSoldItems : 0,
        });
    }
    catch (error) {
        console_1.default.error(error);
        res
            .status(500)
            .json({ message: "An error occurred while fetching statistics." });
    }
});
exports.getStatistics = getStatistics;
const getBarChartData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { month } = req.query;
        if (!month) {
            return res
                .status(400)
                .json({ message: "Month is a required parameter." });
        }
        const parsedMonth = month !== "All" ? parseInt(month, 10) : null;
        if (parsedMonth !== null &&
            (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12)) {
            return res.status(400).json({ message: "Invalid month format." });
        }
        const aggregationPipeline = [
            {
                $addFields: {
                    dateOfSale: {
                        $dateFromString: { dateString: "$dateOfSale" },
                    },
                },
            },
        ];
        if (parsedMonth !== null) {
            aggregationPipeline.push({
                $match: {
                    $expr: {
                        $eq: [{ $month: "$dateOfSale" }, parsedMonth],
                    },
                },
            });
        }
        aggregationPipeline.push({
            $bucket: {
                groupBy: "$price",
                boundaries: [0, 101, 201, 301, 401, 501, 601, 701, 801, 901, Infinity],
                default: "901-above",
                output: {
                    itemCount: { $sum: 1 },
                },
            },
        });
        aggregationPipeline.push({
            $project: {
                _id: 0,
                priceRange: {
                    $switch: {
                        branches: [
                            { case: { $eq: ["$_id", 0] }, then: "0-100" },
                            { case: { $eq: ["$_id", 101] }, then: "101-200" },
                            { case: { $eq: ["$_id", 201] }, then: "201-300" },
                            { case: { $eq: ["$_id", 301] }, then: "301-400" },
                            { case: { $eq: ["$_id", 401] }, then: "401-500" },
                            { case: { $eq: ["$_id", 501] }, then: "501-600" },
                            { case: { $eq: ["$_id", 601] }, then: "601-700" },
                            { case: { $eq: ["$_id", 701] }, then: "701-800" },
                            { case: { $eq: ["$_id", 801] }, then: "801-900" },
                            { case: { $eq: ["$_id", 901] }, then: "901-above" },
                        ],
                        default: "901-above",
                    },
                },
                itemCount: 1,
            },
        });
        const barChartData = yield transaction_model_1.default.aggregate(aggregationPipeline).exec();
        res.status(200).json(barChartData);
    }
    catch (error) {
        console_1.default.error(error);
        res
            .status(500)
            .json({ message: "An error occurred while fetching bar chart data." });
    }
});
exports.getBarChartData = getBarChartData;
const getPieChartData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { month } = req.query;
        if (!month) {
            return res
                .status(400)
                .json({ message: "Month is a required parameter." });
        }
        const parsedMonth = month !== "All" ? parseInt(month, 10) : null;
        if (parsedMonth !== null &&
            (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12)) {
            return res.status(400).json({ message: "Invalid month format." });
        }
        const aggregationPipeline = [
            {
                $addFields: {
                    dateOfSale: {
                        $dateFromString: { dateString: "$dateOfSale" },
                    },
                },
            },
        ];
        if (parsedMonth !== null) {
            aggregationPipeline.push({
                $match: {
                    $expr: {
                        $eq: [{ $month: "$dateOfSale" }, parsedMonth],
                    },
                },
            });
        }
        aggregationPipeline.push({
            $group: {
                _id: "$category",
                itemCount: { $sum: 1 },
            },
        });
        aggregationPipeline.push({
            $project: {
                _id: 0,
                category: "$_id",
                itemCount: 1,
            },
        });
        const pieChartData = yield transaction_model_1.default.aggregate(aggregationPipeline).exec();
        res.status(200).json(pieChartData);
    }
    catch (error) {
        console_1.default.error(error);
        res
            .status(500)
            .json({ message: "An error occurred while fetching pie chart data." });
    }
});
exports.getPieChartData = getPieChartData;
const getCombinedData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { month } = req.query;
        if (!month) {
            return res
                .status(400)
                .json({ message: "Month is a required parameter." });
        }
        const statisticsUrl = `${baseUrl}/statistics?month=${month}`;
        const barChartDataUrl = `${baseUrl}/bar-chart-data?month=${month}`;
        const pieChartDataUrl = `${baseUrl}/pie-chart?month=${month}`;
        const [statisticsResponse, barChartDataResponse, pieChartDataResponse] = yield Promise.all([
            axios_1.default.get(statisticsUrl),
            axios_1.default.get(barChartDataUrl),
            axios_1.default.get(pieChartDataUrl),
        ]);
        const combinedData = {
            statistics: statisticsResponse.data,
            barChartData: barChartDataResponse.data,
            pieChartData: pieChartDataResponse.data,
        };
        res.status(200).json(combinedData);
    }
    catch (error) {
        console_1.default.error(error);
        res
            .status(500)
            .json({ message: "An error occurred while fetching combined data." });
    }
});
exports.getCombinedData = getCombinedData;
