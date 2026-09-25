async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('http://127.0.0.1:5198/?focus');await page.waitForFunction(()=>window.mount);
 await page.evaluate(async()=>{window.view.dispose();window.copied.dispose();window.reactRoot.unmount();const o={backend:'webgl2',quality:'performance',resolutionScale:.3,asciiEnabled:false,interactive:true,paused:false,debugStats:true};window.a=window.mount(document.querySelector('#vanilla'),o);window.b=window.mount(document.querySelector('#copied'),o);await Promise.all([window.a.ready,window.b.ready])});
 const before=await page.evaluate(()=>[window.a.snapshot().cameraPosition,window.b.snapshot().cameraPosition]);
 await page.locator('#vanilla canvas').click();await page.keyboard.down('w');await page.waitForTimeout(350);await page.keyboard.up('w');await page.waitForTimeout(260);
 const after=await page.evaluate(()=>[window.a.snapshot().cameraPosition,window.b.snapshot().cameraPosition]);
 if(JSON.stringify(before[0])===JSON.stringify(after[0]))throw Error('Focused canvas did not move');
 if(JSON.stringify(before[1])!==JSON.stringify(after[1]))throw Error('Unfocused canvas moved');
 await page.screenshot({path:'work/browser-render.png'});
 await page.evaluate(()=>{window.a.dispose();window.b.dispose()});
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS: focused keyboard navigation, independent instances, clean console/network');
}
