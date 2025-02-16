import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "..";

export const WORKER_JWT_SECRET = JWT_SECRET + "worker";
const router = Router();
const prismaClient = new PrismaClient();

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