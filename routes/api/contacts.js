const express = require('express')
const Joi = require('joi')
const { createError } = require('../../helpers')
const Contact = require('../../models/contacts')

const router = express.Router()

const phoneRegExp =
  /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/

const schemaContact = Joi.object({
  name: Joi.string().required().alphanum(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(phoneRegExp).required(),
  favorite: Joi.boolean(),
})

const schemaUpdate = Joi.object({
  name: Joi.string().alphanum(),
  email: Joi.string().email(),
  phone: Joi.string()
    .pattern(phoneRegExp)
    .message('Phone number must be min 6 numbers length'),
  favorite: Joi.boolean(),
}).min(1)

const updateFavoriteSchema = Joi.object({
  favorite: Joi.boolean().required(),
})


router.get('/', async (req, res, next) => {
  try {
    const result = await Contact.find({}, 'name email phone');
    return res.status(200).json(result)
  } catch(error) {
    next(error);
  }
})

router.get('/:contactId', async (req, res, next) => {
  try {
    const contactId = req.params.contactId;
    const result = await Contact.findById(contactId);
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
    const { error } = await schemaContact.validateAsync(req.body);
    if (error) {
      throw createError(400, "missing required name field");
    }
    if (req.body.favorite === undefined) {
      req.body.favorite = false
    }
    const result = await Contact.create(req.body)
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
})

router.delete('/:contactId', async (req, res, next) => {
  try {
    const contactId = req.params.contactId
    const result = await Contact.findByIdAndRemove(contactId);
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
     const result = await Contact.findByIdAndUpdate(contactId, req.body, {new: true})
     if (!result) {
       throw createError(404, "Not Found");
     }
     res.status(200).json(result)
    } catch (error) {
    next(error);
  }
})

router.patch('/:contactId/favorite', async (req, res, next) => {
  try {
    const contactId = req.params.contactId;
    const { error } = await updateFavoriteSchema.validateAsync(req.body);
    if (error) {
      throw createError(400, "missing field favorite");
    }
    const result = await Contact.findByIdAndUpdate(contactId, req.body, {new : true});
    if (!result) {
       throw createError(404, "Not Found");
    }
    res.status(200).json(result)
  } catch (error) {
    next(error);
  }
})

module.exports = router


