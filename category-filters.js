(function(){
  function init(){
    var grid=document.getElementById("category-products");
    if(!grid)return;
    var cards=Array.prototype.slice.call(grid.children);
    var search=document.getElementById("category-search");
    var max=document.getElementById("category-max-price");
    var sort=document.getElementById("category-sort");
    var count=document.getElementById("category-count");
    function apply(){
      var q=(search.value||"").toLowerCase().trim();
      var cap=Number(max.value)>0?Number(max.value):Infinity;
      var visible=[];
      cards.forEach(function(card){
        var match=(card.getAttribute("data-search")||card.textContent).toLowerCase().indexOf(q)!==-1 && Number(card.getAttribute("data-price")||0)<=cap;
        card.hidden=!match;
        if(match)visible.push(card);
      });
      if(sort.value==="price-low")visible.sort(function(a,b){return Number(a.dataset.price)-Number(b.dataset.price);});
      if(sort.value==="price-high")visible.sort(function(a,b){return Number(b.dataset.price)-Number(a.dataset.price);});
      visible.forEach(function(card){grid.appendChild(card);});
      count.textContent=visible.length+" of "+cards.length+" products";
    }
    search.addEventListener("input",apply);
    max.addEventListener("input",apply);
    sort.addEventListener("change",apply);
    apply();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();