function canChangeAccountType(currentType, nextType) {
  return !currentType || currentType !== nextType;
}

function getAccountTypeChangeError(currentType) {
  if (!currentType) {
    return "You already selected this account type.";
  }

  return `You already have a ${currentType} account. Choose a different account type to continue.`;
}

module.exports = {
  canChangeAccountType,
  getAccountTypeChangeError,
};
