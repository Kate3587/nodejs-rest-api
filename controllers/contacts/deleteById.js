const Contact = require('../../models/contacts');
const { createError } = require('../../helpers');

const deleteById = async (req, res) => {
        const contactId = req.params.contactId
        const result = await Contact.findByIdAndRemove(contactId);
        if (!result) {
            throw createError(404, "Not Found");
        }
        res.status(200).json({ message: "contact deleted" });
};

module.exports = deleteById;