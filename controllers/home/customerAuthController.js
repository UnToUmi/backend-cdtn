const customerModel = require("../../models/customerModel");
const { responseReturn } = require("../../utiles/response");
const bcrypt = require("bcrypt");
const sellerCustomerModel = require("../../models/chat/sellerCustomerModel");
const { createToken } = require("../../utiles/tokenCreate");

class customerAuthController {
  customer_register = async (req, res) => {
    const { name, email, password } = req.body;

    try {
      const customer = await customerModel.findOne({ email });
      if (customer) {
        responseReturn(res, 404, { error: "Email Already Exits" });
      } else {
        const createCustomer = await customerModel.create({
          name: name.trim(),
          email: email.trim(),
          password: await bcrypt.hash(password, 10),
          method: "menualy",
        });
        await sellerCustomerModel.create({
          myId: createCustomer.id,
        });
        const token = await createToken({
          id: createCustomer.id,
          name: createCustomer.name,
          email: createCustomer.email,
          method: createCustomer.method,
        });
        res.cookie("customerToken", token, {
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        responseReturn(res, 201, { message: "User Register Success", token });
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  // End Method

  customer_login = async (req, res) => {
    const { email, password } = req.body;
    try {
      const customer = await customerModel
        .findOne({ email })
        .select("+password");
      if (customer) {
        const match = await bcrypt.compare(password, customer.password);
        if (match) {
          const token = await createToken({
            id: customer.id,
            name: customer.name,
            email: customer.email,
            method: customer.method,
          });
          res.cookie("customerToken", token, {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });
          responseReturn(res, 201, { message: "User Login Success", token });
        } else {
          responseReturn(res, 404, { error: "Password Wrong" });
        }
      } else {
        responseReturn(res, 404, { error: "Email Not Found" });
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  // End Method

  customer_logout = async (req, res) => {
    res.cookie("customerToken", "", {
      expires: new Date(Date.now()),
    });
    responseReturn(res, 200, { message: "Logout Success" });
  };
  // End Method

  customer_change_password = async (req, res) => {
    const { userId, old_password, new_password, confirm_password } = req.body;

    try {
      const customer = await customerModel.findById(userId).select("+password");
      if (!customer) {
        return responseReturn(res, 404, { error: "User not found!" });
      }

      const match = await bcrypt.compare(old_password, customer.password);
      if (!match) {
        return responseReturn(res, 400, {
          error: "Old password is incorrect!",
        });
      }

      if (new_password !== confirm_password) {
        return responseReturn(res, 400, { error: "Passwords do not match!" });
      }

      const isSameAsOldPassword = await bcrypt.compare(
        new_password,
        customer.password
      );
      if (isSameAsOldPassword) {
        return responseReturn(res, 400, {
          error: "New password must be different from the old password!",
        });
      }

      const hashedNewPassword = await bcrypt.hash(new_password, 10);
      customer.password = hashedNewPassword;
      await customer.save();

      responseReturn(res, 200, { error: "Password changed successfully!" });
    } catch (error) {
      console.error(error);
      responseReturn(res, 500, { error: "Internal Server Error" });
    }
  };
}

module.exports = new customerAuthController();
