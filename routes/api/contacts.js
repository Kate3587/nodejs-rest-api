const express = require('express')
const Joi = require('joi')
const { createError } = require('../../helpers')

const {
  listContacts,
  addContact,
  getContactById,
  removeContact,
  updateContact,
} = require('../../models/contacts')

const router = express.Router()

const phoneRegExp =
  /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/

const contactsSchema = Joi.object({
  name: Joi.string().required().alphanum(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(phoneRegExp).required(),
})

const schemaUpdate = Joi.object({
  name: Joi.string().alphanum(),
  email: Joi.string().email(),
  phone: Joi.string()
    .pattern(phoneRegExp)
    .message('Phone number must be min 6 numbers length'),
}).min(1)


router.get('/', async (req, res, next) => {
  const result = await listContacts()
  return res.status(200).json(result)
})

router.get('/:contactId', async (req, res, next) => {
  try {
    const contactId = req.params.contactId;
    const result = await getContactById(contactId);
    if (!result) {
      throw createError(404, "Not Found");
    }
    res.status(200).json(result);
  } catch(error) {
    next(error);
  }
})

router.post('/', async (req, res, next) => { 
  try {
    const { error } = await contactsSchema.validateAsync(req.body);
    if (error) {
      throw createError(400, "missing required name field");
    }
    const { name, email, phone } = await req.body;
    const result = await addContact(name, email, phone);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
})

router.delete('/:contactId', async (req, res, next) => {
  try {
    const contactId = req.params.contactId
    const result = await removeContact(contactId);
    if (!result) {
      throw createError(404, "Not Found");
    }
    res.status(200).json({ message: "contact deleted" });
  } catch (error) {
    next(error);
  }
})

router.put('/:contactId', async (req, res, next) => {
    const contactId = req.params.contactId
    const userRequest = await req.body
   try {
    const { error } = schemaUpdate.validate(userRequest);
     if (error) {
      throw createError(400, "missing fields");
     }
     const result = await updateContact(contactId, userRequest)
     if (!result) {
       throw createError(404, "Not Found");
     }
     res.status(200).json(result)
    } catch (error) {
    next(error);
  }
})

module.exports = router
