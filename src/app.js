import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();

app.use(
    cors({
        origin: (origin, callback) => {
            // console.log("Incoming Origin:", origin); // Log incoming origins
            const allowedOrigins = [process.env.CLIENT_URL, process.env.ADMIN_URL, process.env.NEWURL];

            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true); // Allow request
            } else {
                console.error(`Blocked by CORS: ${origin}`); // Log rejected origin
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

app.use(
    express.json({
        limit: "50kb",
    })
);
app.use(
    express.urlencoded({
        extended: true,
        limit: "16kb",
    })
);
app.use(express.static("public"));
app.use(cookieParser());

// import routes from routers

import authRouter from  './routers/Auth.routes.js'
import adminRouter from  './routers/Admin.routes.js'
import bookRouter from  './routers/Book.routes.js'
import dashboardRouter  from './routers/Dashboard.routes.js'

// routes declaration

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/admin', adminRouter)
app.use('/api/v1/book', bookRouter)
app.use('/api/v1/dashboard', dashboardRouter)


export { app };
