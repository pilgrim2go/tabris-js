import {extend} from '../util';
import Composite from './Composite';
import Page from './Page';
import ImageView from './ImageView';
import TextView from './TextView';
import CollectionView from './CollectionView';

let PageSelector = function(properties) {
  let instance = new CollectionView(extend({
    items: getPages(),
    initializeCell,
    itemHeight: tabris.device.platform === 'iOS' ? 40 : 48,
    layoutData: {left: 0, top: 0, right: 0, bottom: 0}
  }, properties));
  instance.on('select', (target, value) => {
    if (value instanceof Page) {
      if (tabris.ui.drawer) {
        tabris.ui.drawer.close();
      }
      value.open();
    }
  });
  tabris.ui.on('addchild', insertPage, instance).on('removechild', removePage, instance);
  instance.on('dispose', () => {
    tabris.ui.off('addchild', insertPage);
    tabris.ui.off('removechild', removePage);
  });
  return instance;
};

export default PageSelector;

PageSelector.prototype.type = 'PageSelector';

function insertPage(ui, child) {
  if (child instanceof Page && child.get('topLevel')) {
    this.insert([child]);
  }
}

function removePage(ui, child) {
  let index = this.get('items').indexOf(child);
  if (index !== -1) {
    this.remove(index);
  }
}

function getPages() {
  return tabris.ui.children('Page').toArray().filter(page => page.get('topLevel'));
}

function initializeCell(cell) {
  new Composite({
    layoutData: {left: 0, right: 0, bottom: 0, height: 1},
    background: '#bbb'
  }).appendTo(cell);
  let imageView = new ImageView({
    layoutData: {left: 10, top: 10, bottom: 10}
  }).appendTo(cell);
  let textView = new TextView({
    layoutData: {left: 72, centerY: 0},
    font: tabris.device.platform === 'iOS' ? '17px .HelveticaNeueInterface-Regular' : '14px Roboto Medium',
    textColor: tabris.device.platform === 'iOS' ? 'rgb(22, 126, 251)' : '#212121'
  }).appendTo(cell);
  cell.on('change:item', (widget, page) => {
    imageView.set('image', page.get('image'));
    textView.set('text', page.get('title'));
  });
}
