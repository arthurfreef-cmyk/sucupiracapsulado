import asyncio,json
from playwright.async_api import async_playwright
CODE='000201'+'1234567890'*16
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  page=await browser.new_page(viewport={"width":1280,"height":1800})
  errors=[]; requests=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  await page.route('**/viacep.com.br/**',lambda r:r.fulfill(json={"logradouro":"Praça da Sé","bairro":"Sé","localidade":"São Paulo","uf":"SP"}))
  async def charge(r):
   requests.append(json.loads(r.request.post_data));await asyncio.sleep(.5)
   await r.fulfill(json={"id":"test-charge","status":"pending","amount":1290,"orderProof":"test-proof","pix":{"code":CODE,"expires_at":"2026-12-04T12:00:00Z"}})
  await page.route('**/api/fruitfy-pix',charge)
  await page.route('**/api/fruitfy-status',lambda r:r.fulfill(json={"paid":False,"eligible":False}))
  await page.goto('http://localhost:8080/checkout/k1?utm_source=meta&utm_campaign=bf',wait_until='networkidle')
  await page.screenshot(path='/tmp/browser/checkout-refine/desktop.png')
  await page.get_by_role('button',name='COMPRAR AGORA').click()
  assert await page.locator('#name').evaluate('(e)=>e===document.activeElement')
  for name,value in [('name','Maria Silva'),('email','maria@example.com'),('phone','11999999999'),('document','52998224725'),('zip','01001000'),('number','123')]:
   await page.locator(f'input[name="{name}"]').fill(value)
  await page.get_by_role('button',name='Editar endereço').wait_for()
  await page.get_by_role('button',name='Editar endereço').click()
  await page.locator('#street').fill('')
  await page.get_by_role('button',name='COMPRAR AGORA').click()
  await page.get_by_text('Informe rua',exact=True).wait_for()
  assert await page.locator('#street').evaluate('(e)=>e===document.activeElement')
  await page.locator('#street').fill('Rua corrigida')
  await page.get_by_role('button',name='COMPRAR AGORA').click()
  assert await page.locator('#name').is_disabled()
  await page.get_by_role('heading',name='PIX Gerado com Sucesso!').wait_for()
  await page.get_by_alt_text('PIX QR Code').wait_for()
  assert len(requests)==1 and requests[0]['address']['street']=='Rua corrigida'
  assert requests[0]['shipping']['amount']==0
  assert 'utm_source=meta' in requests[0].get('utm','') and await page.locator('script[src*="cdn.utmify.com.br"]').count()==1
  await page.get_by_role('button',name='COPIAR CÓDIGO').click()
  await page.get_by_role('button',name='COPIADO').wait_for()
  await page.get_by_role('button',name='Já realizei o pagamento').click()
  await page.get_by_role('alert').wait_for()
  assert '/checkout/k1' in page.url
  await page.screenshot(path='/tmp/browser/checkout-refine/pix.png')
  await page.reload(wait_until='networkidle')
  await page.get_by_alt_text('PIX QR Code').wait_for()
  assert len(requests)==1
  # Storage reads succeed but writes fail: existing charge must still recover.
  await page.add_init_script("Storage.prototype.setItem=function(){throw new Error('blocked write')}")
  await page.reload(wait_until='networkidle')
  await page.get_by_role('heading',name='PIX Gerado com Sucesso!').wait_for()
  assert len(requests)==1
  for width in [390,320]:
   mobile=await browser.new_page(viewport={"width":width,"height":844})
   await mobile.goto('http://localhost:8080/checkout/k5',wait_until='networkidle')
   assert await mobile.evaluate('document.documentElement.scrollWidth <= innerWidth')
   await mobile.screenshot(path=f'/tmp/browser/checkout-refine/mobile-{width}.png')
   await mobile.close()
  print('PASS: invalid-field focus, manual address correction, locked inputs, one charge, QR, copy, unpaid confirmation, reload and blocked-write recovery; desktop/mobile widths. Errors:',errors)
  assert not [e for e in errors if e!='blocked write']  # tracker may reject simulated blocked storage; PIX must still recover
  await browser.close()
asyncio.run(main())
