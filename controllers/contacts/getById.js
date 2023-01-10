const Contact = require('../../models/contacts');
const { createError } = require('../../helpers')

const getById = async (req, res) => {
    const contactId = req.params.contactId;
    const result = await Contact.findById(contactId);
    if (!result) {
      throw createError(404, "Not Found");
    }
    res.status(200).json(result);
}

module.exports = getById;