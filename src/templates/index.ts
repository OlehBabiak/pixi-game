import Handlebars, { HelperOptions } from "handlebars";

Handlebars.registerHelper(
  "ifEquals",
  function (this: unknown, a: number | string, b: number | string, options: HelperOptions) {
    return a === b ? options.fn(this) : options.inverse(this);
  }
);

export function getMenuTemplate() {
  return `
    <div class="modal">
      <h2>Menu</h2>
      <ul class="menu-list">
        {{#each items}}
          <li><a href="#" data-action="{{action}}">{{name}}</a></li>
        {{/each}}
      </ul>
      <button data-action="close"">Close</button>
    </div>
  `;
}

export function getBetTemplate() {
  return `
  <div class="modal">
    <h2>Bet Settings</h2>
    <p>Current Bet: </p>
    <select data-action="updateBet">
      {{#each betOptions}}
  <option value="{{this}}" {{#ifEquals this ../currentBet}}selected{{/ifEquals}}>$ {{this}}</option>
{{/each}}
    </select>
    <button data-action="close">Close</button>
  </div>
  `;
}
