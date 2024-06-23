import axios from "axios";
import console from "console";
import { Request, Response } from "express";
import { env_conf } from "../config/env-config";
import Transaction from "../models/transaction-model";
import {
  BarChartQueryParams,
  BarChartResponse,
  PieChartQueryParams,
  PieChartResponse,
  QueryParams,
  StatsQueryParams,
  StatsResponse,
} from "../types";

const baseUrl =
  env_conf.node_env === "dev"
    ? `http://localhost:${process.env.PORT}/api/v1/transaction`
    : ""; // Adjust the base URL if needed

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const params: QueryParams = req.query as unknown as QueryParams;

    const page = parseInt(params.page as string, 10) || 1;
    const perPage = parseInt(params.per_page as string, 10) || 10;
    const search = params.search || "";
    const transactionMonth = params.transactionMonth || "All";
    console.log("search==>", typeof search);
    const isNumber = !isNaN(Number(search));

    console.log("isNumber===>", isNumber);
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
      searchQuery = { ...searchQuery, ...monthQuery };
    }

    const transactions = await Transaction.find(searchQuery)
      .skip((page - 1) * perPage)
      .limit(perPage);

    const totalTransactions = await Transaction.countDocuments(searchQuery);

    res.status(200).json({
      transactions,
      pagination: {
        page,
        perPage,
        totalPages: Math.ceil(totalTransactions / perPage),
        totalTransactions,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching transactions." });
  }
};

export const getStatistics = async (req: Request, res: Response) => {
  try {
    const { month }: any = req.query as StatsQueryParams;

    if (!month) {
      return res
        .status(400)
        .json({ message: "Month is a required parameter." });
    }

    const parsedMonth = month !== "All" ? parseInt(month, 10) : null;

    if (
      parsedMonth !== null &&
      (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12)
    ) {
      return res.status(400).json({ message: "Invalid month format." });
    }

    const aggregationPipeline: any[] = [
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

    const [statistics] = await Transaction.aggregate<StatsResponse>(
      aggregationPipeline
    ).exec();

    res.status(200).json({
      totalSaleAmount: statistics ? statistics.totalSaleAmount : 0,
      totalSoldItems: statistics ? statistics.totalSoldItems : 0,
      totalNotSoldItems: statistics ? statistics.totalNotSoldItems : 0,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching statistics." });
  }
};

export const getBarChartData = async (req: Request, res: Response) => {
  try {
    const { month } = req.query as BarChartQueryParams;

    if (!month) {
      return res
        .status(400)
        .json({ message: "Month is a required parameter." });
    }

    const parsedMonth = month !== "All" ? parseInt(month, 10) : null;

    if (
      parsedMonth !== null &&
      (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12)
    ) {
      return res.status(400).json({ message: "Invalid month format." });
    }

    const aggregationPipeline: any[] = [
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

    const barChartData = await Transaction.aggregate<BarChartResponse>(
      aggregationPipeline
    ).exec();

    res.status(200).json(barChartData);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching bar chart data." });
  }
};

export const getPieChartData = async (req: Request, res: Response) => {
  try {
    const { month } = req.query as PieChartQueryParams;

    if (!month) {
      return res
        .status(400)
        .json({ message: "Month is a required parameter." });
    }

    const parsedMonth = month !== "All" ? parseInt(month, 10) : null;

    if (
      parsedMonth !== null &&
      (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12)
    ) {
      return res.status(400).json({ message: "Invalid month format." });
    }

    const aggregationPipeline: any[] = [
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

    const pieChartData = await Transaction.aggregate<PieChartResponse>(
      aggregationPipeline
    ).exec();

    res.status(200).json(pieChartData);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching pie chart data." });
  }
};

export const getCombinedData = async (req: Request, res: Response) => {
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

    const [statisticsResponse, barChartDataResponse, pieChartDataResponse] =
      await Promise.all([
        axios.get(statisticsUrl),
        axios.get(barChartDataUrl),
        axios.get(pieChartDataUrl),
      ]);

    const combinedData = {
      statistics: statisticsResponse.data,
      barChartData: barChartDataResponse.data,
      pieChartData: pieChartDataResponse.data,
    };

    res.status(200).json(combinedData);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching combined data." });
  }
};
