import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { workerMiddleware } from "../middleware";
import { JWT_SECRET, TOTAL_DECIMALS, WORKER_JWT_SECRET } from "../config";
import { getNextTask } from "../db";
import { createSubmissionInput } from "../types";

const TOTAL_SUBMISSIONS = 100;
const router = Router();
const prismaClient = new PrismaClient();

// @ts-ignore
router.post("/submission", workerMiddleware, async (req, res) => {
    // @ts-ignore
    const userId = req.userId;
    const body = req.body;
    const parsedBody = createSubmissionInput.safeParse(body);

    if (parsedBody.success) {
        const task = await getNextTask(Number(userId));
        if (!task || task?.id !== Number(parsedBody.data.taskId)) {
            return res.status(411).json({
                message: "Incorrect task id"
            })
        }

        const amount = (Number(task.amount) / TOTAL_SUBMISSIONS).toString();

        const submission = await prismaClient.$transaction(async tx => {
            const submission = await prismaClient.submission.create({
                data: {
                    option_id: Number(parsedBody.data.selection),
                    worker_id: userId,
                    task_id: Number(parsedBody.data.taskId),
                    amount
                }
            })

            await tx.worker.update({
                where: {
                    id: userId,
                },
                data: {
                    pending_amount: {
                        increment: Number(amount) * TOTAL_DECIMALS
                    }
                }
            })

            return submission;
        })

        const nextTask = await getNextTask(Number(userId));
        res.json({
            nextTask,
            amount
        })

    } else {
        res.status(411).json({
            message: "Incorrect inputs"
        })
            
    }
})

// @ts-ignore
router.get("/nextTask", workerMiddleware, async (req, res) => {
    // @ts-ignore
    const userId: string = req.userId;

    const task = await getNextTask(Number(userId));

    if (!task) {
        res.status(411).json({   
            message: "No more tasks left for you to review"
        })
    } else {
        res.json({   
            task
        })
    }
})

// Sigin with wallet
router.post("/signin", async (req, res) => {
    // Todo:: Add sign verification logic here
    const hardcodedWalletAddress = '6jzpRtC34tF5MmrZ1irtFtbSYaUdW7HH9FKLS6gKXeqa';

    const existingUser = await prismaClient.worker.findFirst({
        where: {
            address: hardcodedWalletAddress
        }
    })

    if (existingUser) {
        const token = jwt.sign({
            userId: existingUser.id
        }, WORKER_JWT_SECRET)

        res.json({
            token
        })
    } else {
        const user = await prismaClient.worker.create({
            data: {
                address: hardcodedWalletAddress,
                pending_amount: 0,
                locked_amount: 0
            }
        })

        const token = jwt.sign({
            userId: user.id
        }, WORKER_JWT_SECRET)

        res.json({
            token
        })
    }
});

export default router;