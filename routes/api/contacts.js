const express = require('express')

const { ctrlWrapper } = require('../../helpers')
const ctrl = require('../../controllers/contacts')
const authorize = require('../../middlewares/authorize')

const router = express.Router()

router.get('/', authorize, ctrlWrapper(ctrl.getAll));

router.get('/:contactId', authorize, ctrlWrapper(ctrl.getById));

router.post('/', authorize, ctrlWrapper(ctrl.add));

router.delete('/:contactId', authorize, ctrlWrapper(ctrl.deleteById));

router.put('/:contactId', authorize, ctrlWrapper(ctrl.updateById));

router.patch('/:contactId/favorite', authorize, ctrlWrapper(ctrl.updateFavourite));

module.exports = router;


