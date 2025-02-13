import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { JWT_SECRET } from "..";
import { authMiddleware } from "../middleware";

const s3Client = new S3Client({
    credentials: {
        accessKeyId: "",
        secretAccessKey: "",
    },
    region: "us-east-1"
})

const router = Router();
const prismaClient = new PrismaClient();

// @ts-ignore
router.get("/presignedUrl", authMiddleware, async (req, res) => {
    // @ts-ignore
    const userId = req.userId;

    const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: 'shrinjoy-development',
        Key: `thumbnail-ctr-finder/${userId}/${Math.random()}/image.jpg`,
        Conditions: [
          ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
        ],
        Fields: {
            'content-Types': 'image/png'
        },
        Expires: 3600
    })

    res.json({
        preSignedUrl: url,
        fields
    })
})

// Sigin with wallet
router.post("/signin", async (req, res) => {
    // Todo:: Add sign verification logic here
    const hardcodedWalletAddress = '6jzpRtC34tF5MmrZ1irtFtbSYaUdW7HH9FKLS6gKXeqr';

    const existingUser = await prismaClient.user.findFirst({
        where: {
            address: hardcodedWalletAddress
        }
    })

    if (existingUser) {
        const token = jwt.sign({
            userId: existingUser.id
        }, JWT_SECRET)

        res.json({
            token
        })
    } else {
        const user = await prismaClient.user.create({
            data: {
                address: hardcodedWalletAddress,
            }
        })

        const token = jwt.sign({
            userId: user.id
        }, JWT_SECRET)

        res.json({
            token
        })
    }
});

export default router;