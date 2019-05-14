describe('Protractor Element demo',function() {  


it('Locators',function() {
browser.get('http://juliemr.github.io/protractor-demo/');
//repeater ,  chain locators, And css for identical tags
element(by.model("first")).sendKeys("3");
element(by.model("second")).sendKeys("5");

element(by.id("gobutton")).click();

expect(element(by.css("h2[class='ng-binding']")).getText()).toBe("8");

element(by.css("h2[class='ng-binding']")).getText().then(function(text)
{

console.log(text);
})


// element(by.model("operator")).element(by.css("option:nth-child(4)")).click();







})

})