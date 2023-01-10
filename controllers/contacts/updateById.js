const Contact = require('../../models/contacts');
const { createError } = require('../../helpers');
const Joi = require('joi');


const phoneRegExp =
  /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/

const schemaUpdate = Joi.object({
  name: Joi.string().alphanum(),
  email: Joi.string().email(),
  phone: Joi.string()
    .pattern(phoneRegExp)
    .message('Phone number must be min 6 numbers length'),
  favorite: Joi.boolean(),
}).min(1)

const updateById = async (req, res) => {
    const contactId = req.params.contactId
    const userRequest = await req.body
    const { error } = schemaUpdate.validate(userRequest);
     if (error) {
      throw createError(400, "missing fields");
     }
     const result = await Contact.findByIdAndUpdate(contactId, req.body, {new: true})
     if (!result) {
       throw createError(404, "Not Found");
     }
     res.status(200).json(result)
}

module.exports = updateById;