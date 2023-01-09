const Contact = require('../../models/contacts');
const { createError } = require('../../helpers');
const Joi = require('joi');

const updateFavoriteSchema = Joi.object({
  favorite: Joi.boolean().required(),
})

const updateFavourite = async (req, res) => {
        const contactId = req.params.contactId;
        const { error } = await updateFavoriteSchema.validateAsync(req.body);
        if (error) {
            throw createError(400, "missing field favorite");
        }
        const result = await Contact.findByIdAndUpdate(contactId, req.body, { new: true });
        if (!result) {
            throw createError(404, "Not Found");
        }
        res.status(200).json(result)
};

module.exports = updateFavourite;