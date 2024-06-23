"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transaction_controller_1 = require("../controllers/transaction-controller");
const express = require("express");
const router = express.Router();
/**
 * @swagger
 * /api/v1/transaction/transactions:
 *   get:
 *     summary: Get Transactions
 *     description: Retrieves a list of transactions based on search criteria, pagination, and optionally by month.
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Page number for pagination
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: per_page
 *         in: query
 *         description: Number of transactions per page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: search
 *         in: query
 *         description: Search term to filter transactions by title, description, or price
 *         required: false
 *         schema:
 *           type: string
 *       - name: transactionMonth
 *         in: query
 *         description: Month to filter transactions (1-12 for specific months, "All" for all months)
 *         required: false
 *         schema:
 *           type: string
 *           default: "All"
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       category:
 *                         type: string
 *                       price:
 *                         type: number
 *                       dateOfSale:
 *                         type: string
 *                         format: date-time
 *                       sold:
 *                         type: boolean
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     perPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalTransactions:
 *                       type: integer
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid month format.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: An error occurred while fetching transactions.
 */
router.get("/transactions", transaction_controller_1.getTransactions);
/**
 * @swagger
 * /api/v1/transaction/statistics:
 *   get:
 *     summary: Get Transaction Statistics
 *     description: Retrieves statistics on transactions, optionally filtered by a specific month or "All" months.
 *     parameters:
 *       - name: month
 *         in: query
 *         description: Month to filter transactions (1-12 for specific months, "All" for all months)
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSaleAmount:
 *                   type: number
 *                   description: Total amount of sales
 *                 totalSoldItems:
 *                   type: number
 *                   description: Total number of sold items
 *                 totalNotSoldItems:
 *                   type: number
 *                   description: Total number of not sold items
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid month format.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: An error occurred while fetching statistics.
 */
router.get("/statistics", transaction_controller_1.getStatistics);
/**
 * @swagger
 * /api/v1/transaction/bar-chart-data:
 *   get:
 *     summary: Get Bar Chart Data
 *     description: Retrieves data for a bar chart representing the distribution of transaction prices, optionally filtered by a specific month.
 *     parameters:
 *       - name: month
 *         in: query
 *         description: Month to filter transactions (1-12 for specific months, "All" for all months)
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   priceRange:
 *                     type: string
 *                     description: Price range bucket
 *                     example: "0-100"
 *                   itemCount:
 *                     type: number
 *                     description: Number of items in the price range
 *                     example: 10
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Month is a required parameter.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: An error occurred while fetching bar chart data.
 */
router.get("/bar-chart-data", transaction_controller_1.getBarChartData);
/**
 * @swagger
 * /api/v1/transaction/pie-chart:
 *   get:
 *     summary: Get Pie Chart Data
 *     description: Retrieves data for a pie chart representing the distribution of transactions by category, optionally filtered by a specific month.
 *     parameters:
 *       - name: month
 *         in: query
 *         description: Month to filter transactions (1-12 for specific months, "All" for all months)
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                     description: Transaction category
 *                     example: "Electronics"
 *                   itemCount:
 *                     type: number
 *                     description: Number of items in the category
 *                     example: 15
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Month is a required parameter.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: An error occurred while fetching pie chart data.
 */
router.get("/pie-chart", transaction_controller_1.getPieChartData);
/**
 * @swagger
 * /api/v1/transaction/combined-data:
 *   get:
 *     summary: Get combined data from all endpoints
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: Month parameter for filtering data
 *     responses:
 *       200:
 *         description: Combined data fetched successfully
 *       400:
 *         description: Invalid month format
 *       500:
 *         description: An error occurred while fetching combined data
 */
router.get("/combined-data", transaction_controller_1.getCombinedData);
module.exports = router;
