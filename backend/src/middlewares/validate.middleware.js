export function validate(validatorFn) {
  return function (req, res, next) {
    try {
      const error = validatorFn(req);
      if (error) {
        return res.status(400).json({ detail: error });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export default validate;
