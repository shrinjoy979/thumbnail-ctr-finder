import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { workerMiddleware } from "../middleware";
import { JWT_SECRET, WORKER_JWT_SECRET } from "../config";

const router = Router();
const prismaClient = new PrismaClient();

// @ts-ignore
router.get("/nextTask", workerMiddleware, async (req, res) => {
    // @ts-ignore
    const userId = req.userId;

    const task = await prismaClient.task.findFirst({
        where: {
            done: false,
            submissions: {
                none: {
                    worker_id: userId
                }
            }
        },
        select:{
            title: true,
            options: true
        }
    })

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