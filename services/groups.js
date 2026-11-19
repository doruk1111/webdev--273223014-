const groupsData = require('../data/groups');

async function list() {
  return groupsData.listAll();
}

module.exports = {
  list,
};
