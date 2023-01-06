const fs = require('fs/promises');
const path = require('path')
const contactsPath = path.join(__dirname, './contacts.json')
const ObjectID = require('bson-objectid')


async function writeNewContacts(data) {
  try {
    const normalizedContactsData = JSON.stringify(data);
    await fs.writeFile(contactsPath, normalizedContactsData, 'utf8');
  } catch (error) {
    console.log(error);
  }
}

const listContacts = async () => {
  try {
    const result = await fs.readFile(contactsPath)
    return await JSON.parse(result)
  } catch (error) {
    console.log(error)
  }
}

const getContactById = async (contactId) => {
  const contacts = await listContacts()
  const result = await contacts.find((item) => item.id === contactId)
  if (!result) return null
  return result
}

const removeContact = async (contactId) => {
  const contacts = await listContacts()
  const idx = contacts.findIndex((item) => item.id === contactId)
  if (idx === -1) return null
  const [result] = contacts.splice(idx, 1)
  await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2))
  return result
}

const addContact = async (name, email, phone) => {
  try {
    const contacts = await listContacts();
    const newContactsList = [...contacts, { id: ObjectID(), name, email, phone }];
    writeNewContacts(newContactsList);
  } catch (error) {
    console.log(error);
  }
}

const updateContact = async (contactId, body) => {
  const contacts = await listContacts()
  const idx = contacts.findIndex((item) => item.id === contactId)
  if (idx === -1) return null;
  contacts[idx] = {
    contactId, ...body
  }
  await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2))
  return contacts[idx];
}

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
}
