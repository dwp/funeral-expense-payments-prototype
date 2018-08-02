const express = require('express')
const router = express.Router()
const config = require('./config.js')
const fepEligibility = require('./fep-eligibility.js');
const fs = require('fs');

// Route index page
router.get('/', function (req, res) {
  res.render('index')
})

// move this
const validateProps = (props, data) => props.filter(prop => !data[prop]);


const checkDapEligibility = (data => data['deceased-qualifying-benefits'] ? data['deceased-qualifying-benefits'].length : false);

const getVersion = ((url, index = 0) => url.slice(1).split('/')[index]);

router.get('*/versions*', (req, res, next) => {
  res.locals.version = getVersion(req.params[1]);
  next();
});

router.get('*/check', (req, res, next) => {
  const isDap = checkDapEligibility(req.session.data);
  const dapProps = ['dap-bank-or-building', 'dap-bank-name', 'dap-bank-account-no', 'dap-bank-sort-code'];
  const isDapComplete = validateProps(dapProps, req.session.data).length === 0;
  if (isDap && !isDapComplete) {
    res.redirect(req.params[0] + '/death-arrears.html');
    res.locals.isDapComplete = true;
  }
  next();
})

router.get('*/payee', (req, res, next) => {
  res.locals.isCallerDap = req.session.data['death-arrears-caller'] === 'true';
  next();
});

router.get('*/handle-eligibility', (req, res, next) => {
  const prefix = req.params[0] + '/';
  let desiredRoute = 'check';
  const value = req.session.data['select-eligibility'];
  if (value === 'fep') {
    desiredRoute = 'funeral-expense-payments/index.html'
  }

  if (value === 'bsp') {
    desiredRoute = 'bereavement-support-payments/index.html'
  }
  // res.redirect(req.params[0] + '/death-arrears.html');
  res.redirect(prefix + desiredRoute);
  // next();
});

router.get('*/check-funeral-date', (req, res, next) => {
  const prefix = req.params[0] + '/';
  const data = req.session.data;
  const dateDiff = fepEligibility.validateFuneralDate(data['fep-funeral-date-year'], data['fep-funeral-date-month'], data['fep-funeral-date-day']);

  if (data['fep-funeral-date'] && dateDiff >= 6) {
    req.session.data.funeralDateError = 'The date supplied is longer than 6 months ago.';
    res.redirect(prefix + 'funeral-date');
  } else {
    req.session.data.funeralDateError = undefined;
    res.redirect(prefix + 'responsibility');
  }
})

router.get('*/check-funeral-responsibility', (req, res, next) => {
  const prefix = req.params[0] + '/';
  const data = req.session.data;

  if (data['fep-funeral-responsibility'] === 'true') {
    req.session.data.funeralResponsibilityError = undefined;
    res.redirect(prefix + 'residency');
  } else {
    req.session.data.funeralResponsibilityError = 'The caller must take responsibility for the costs of the funeral';
    res.redirect(prefix + 'responsibility');
  }
});

router.get('*/check-funeral-residency', (req, res, next) => {
  const prefix = req.params[0] + '/';
  const data = req.session.data;

  if (data['fep-funeral-residency'] === 'true') {
    req.session.data.funeralResidencyError = undefined;
    res.redirect(prefix + 'funeral-location');
  } else {
    req.session.data.funeralResidencyError = 'The deceased must ordinarily be a UK resident';
    res.redirect(prefix + 'residency');
  }
});

router.get('*/check-funeral-location', (req, res, next) => {
  const prefix = req.params[0] + '/';
  const data = req.session.data;

  if (data['fep-funeral-location'] === 'true') {
    req.session.data.funeralLocationError = undefined;
    res.redirect(prefix + 'qualifying-benefits');
  } else {
    req.session.data.funeralLocationError = 'The location of the funeral must be in the UK or EU';
    res.redirect(prefix + 'funeral-location');
  }
});

// This is messy and needs tidying up
router.get('*/check-qualifying-benefits', (req, res, next) => {
  const prefix = req.params[0] + '/';
  const data = req.session.data;
  const benefits = data['fep-qualifying-benefits'] || [];
  if (benefits.length) {
    if (benefits.length === 1 && benefits[0] === '_unchecked') {
    req.session.data.funeralBenefitsError = 'The caller must be in receipt or have one of the following benefits pending';
    res.redirect(prefix + 'qualifying-benefits');
    } else {
    req.session.data.funeralBenefitsError = undefined;
      res.redirect(prefix + 'confirm');
    }
  } else {
    req.session.data.funeralBenefitsError = 'The caller must be in receipt or have one of the following benefits pending';
    res.redirect(prefix + 'qualifying-benefits');
  }
  // if (data['fep-funeral-location'] === 'true') {
  //   res.redirect(prefix + 'confirm');
  // } else {
  //   req.session.data.funeralLocationError = 'The caller must be in receipt or have one of the following benefits pending';
  //   res.redirect(prefix + 'qualifying-benefits');
  // }
});

const handleMissingVersionRoute = (version, route, res) => {
  const fileExists = fs.existsSync(`app/views/${route}`);
  let renderedRoute = route;
  if (!fileExists) {
    renderedRoute = route.replace(version, 'base');
  }
  return res.render(`${renderedRoute.slice(1)}`)
};


module.exports = router
