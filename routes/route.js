const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Product = require('../models/Product')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const dotenv = require('dotenv')
dotenv.config()
const SECRET_KEY = process.env.SECRET_KEY

//middleware 
const authenticateToken = (req, res, next) => {
    try {
        let token = req.headers.authorization;
        if (token) {
            token = token.split(" ")[1]
            let user = jwt.verify(token, SECRET_KEY)
            req.userId = user.id
        } else {
            return res.status(401).json({ message: "Unauthorized User" })
        }
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: "Unauthorized User" })
    }
    next()
}



//signup
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body
    try {

        //to check if this user existed or not
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({
                message: "User already exist"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        //create user
        const result = await User.create({
            name,
            email,
            password: hashedPassword
        })

        //token generation
        const token = jwt.sign({ email: result.email, id: result._id }, SECRET_KEY)
        res.status(201).json({
            user: result,
            token
        })

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "something went wrong"
        })
    }
})

//login
router.post('/login', async (req, res) => {
    const { email, password } = req.body
    try {

        //check if user present in the database or not
        const existingUser = await User.findOne({ email })
        if (!existingUser) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        //match the credentials
        const matchPassword = await bcrypt.compare(password, existingUser.password)//to check the password in the existing user(i.e:- in the user database)

        if (!matchPassword) {
            return res.status(400).json({
                message: "Invalid credentials"
            })
        }

        //to signin generate token
        const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, SECRET_KEY)
        res.status(200).json({
            message: "user login successfully",
            id: existingUser._id,
            name: existingUser.name,
            email,
            token,
        })

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "something went wrong"
        })
    }

})

//add product api
router.post("/add-product", authenticateToken, async (req, res) => {
    try {
        const { name, price, category, company, userId } = req.body;

        const newProduct = new Product({ name, price, category, company, userId });
        const result = await newProduct.save();

        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong" });
    }
});

//get product
router.get('/products', authenticateToken, async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 })
        if (products.length > 0) {
            res.status(200).send(products)
        } else {
            res.status(404).send({ error: "No Products Found" })
        }
    } catch (err) {
        console.error(err)
        res.status(500).send({ error: "Internal Server Error" })
    }
})

router.delete("/product/:id", authenticateToken, async (req, resp) => {
    try {
        const result = await Product.deleteOne({ _id: req.params.id });

        if (result.deletedCount === 0) {
            return resp.status(404).send({ error: "Product not found" });
        }

        return resp.send({ message: "Product deleted successfully" });
    } catch (error) {
        console.error(error);
        return resp.status(500).send({ error: "Internal Server Error" });
    }
});

//get single product 
router.get("/product/:id", authenticateToken, async (req, resp) => {
    let result = await Product.findOne({ _id: req.params.id })
    if (result) {
        resp.send(result)
    } else {
        resp.send({ "result": "No Record Found." })
    }
})

//update a single product
router.put("/product/:id", authenticateToken, async (req, res) => {
    const id = req.params.id
    const { name, price, category, company, userId } = req.body;

    const newProduct = {
        name,
        price,
        category,
        company,
        userId: req.userId
    }

    try {
        await Product.findByIdAndUpdate(id, newProduct, { new: true })
        res.status(200).json(newProduct)
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Something went wrong" })
    }
});

//search api
router.get("/search/:key", authenticateToken, async (req, resp) => {
    try {
        let result = await Product.find({
            "$or": [
                {
                    name: { $regex: req.params.key }
                },
                {
                    company: { $regex: req.params.key }
                },
                {
                    category: { $regex: req.params.key }
                }
            ]
        });
        resp.send(result);
    } catch (error) {
        console.error(error);
        resp.status(500).send({ message: "Internal Server Error" });
    }
});


module.exports = router