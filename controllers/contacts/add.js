const Contact = require('../../models/contacts');
const { createError } = require('../../helpers');
const Joi = require('joi');

const phoneRegExp =
  /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/

const schemaContact = Joi.object({
  name: Joi.string().required().alphanum(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(phoneRegExp).required(),
  favorite: Joi.boolean(),
})

const add = async (req, res) => {
        const { error } = await schemaContact.validateAsync(req.body);
        if (error) {
            throw createError(400, "missing required name field");
        }
        if (req.body.favorite === undefined) {
            req.body.favorite = false
        }
        const result = await Contact.create(req.body)
        return res.status(201).json(result);
}

module.exports = add;