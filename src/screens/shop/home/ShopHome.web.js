/**
 * ShopHome.web.js — on a wide browser the Resto/Coffee tab opens on the
 * desktop front page (ShopHomeWide); a phone-width browser keeps the same
 * screen as the app.
 */
import React from 'react';
import ServicesPanel from '../../../components/shop/ServicesPanel';
import ShopHomeWide from './ShopHomeWide';
import useIsWideWeb from '../../../web/hooks/useIsWideWeb';

export default function ShopHome(props) {
  return useIsWideWeb() ? <ShopHomeWide {...props} /> : <ServicesPanel {...props} />;
}
