# Amafoto y'ibicuruzwa / Product photos

Drop your gas cylinder photos in this folder, then point each product at its
file in `src/data/mockProducts.js`.

Suggested names (match the product ids):

    gas-6kg-refill.png
    gas-12kg-refill.png
    gas-12kg-full.png
    gas-15kg-refill.png
    gas-25kg-refill.png
    gas-regulator.png

Then edit the product entry:

```js
{
  id: 'gas-12kg-refill',
  ...
  image: require('../../assets/products/gas-12kg-refill.png'),
}
```

Guidelines: square-ish (roughly 800×900), transparent PNG or a plain white
background. `ProductCard` renders them with `resizeMode="contain"`, so nothing
gets cropped. Until you add a file, the card shows a clean icon placeholder —
the shop looks finished either way.
