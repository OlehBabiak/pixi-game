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
        <option value="10">$10</option>
        <option value="25">$25</option>
        <option value="50">$50</option>
        <option value="100">$100</option>
      </select>
      <button data-action="close"">Close</button>
    </div>
  `;
}
