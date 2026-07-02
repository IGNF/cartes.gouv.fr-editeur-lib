import LayerFormat from '../format/layer/Layer.js';

// import local des layers
import GeoportalWFS from "geopf-extensions-openlayers/src/packages/Layers/LayerWFS";
import GeoportalWMS from "geopf-extensions-openlayers/src/packages/Layers/LayerWMS";
import GeoportalWMTS from "geopf-extensions-openlayers/src/packages/Layers/LayerWMTS";
import GeoportalMapBox from "geopf-extensions-openlayers/src/packages/Layers/LayerMapBox";

import Config from "geopf-extensions-openlayers/src/packages/Utils/Config";
import LayerConfig from "geopf-extensions-openlayers/src/packages/Utils/LayerConfigUtils";


const constructors = {
  "GeoportalWMS": GeoportalWMS,
  "GeoportalWMTS": GeoportalWMTS,
  "GeoportalMapBox": GeoportalMapBox,
  "GeoportalWFS": GeoportalWFS,
};

/**
 * @typedef {[String, typeof GeoportalWMS | typeof GeoportalWMTS | typeof GeoportalMapBox | typeof GeoportalWFS]} ValidConstructorEntry Tuple de nom et constructeur associé.
 */

/** 
 * @classdesc
 * Classe permettant de lire / écrire une couche de tuiles des extensions geopf
 */
class GeopfExtensionsFormat extends LayerFormat {
  constructor() {
    super();
  }

  /**
   * @type {Array<ValidConstructorEntry>} Liste des constructeur valides pour ce format
   * @static
   */
  static validConstructors = Object.freeze(Object.entries(constructors));

  /**
   * 
   * @param {Object} options Objet json (couche provenant du fichier .carte)
   * @return {GeoportalWMS|GeoportalWMTS|GeoportalMapBox|GeoportalWFS} Couche à ajouter
   * @override
   */
  read(options) {
    let isGeopfLayer = false;
    let Constructor = null;
    for (let i = 0; i < GeopfExtensionsFormat.validConstructors.length; i++) {
      const [constructorName, constructorClass] = GeopfExtensionsFormat.validConstructors[i];
      // Le type est bien un type correspondant aux extensions gpf
      if (options.type === constructorName) {
        isGeopfLayer = true;
        Constructor = constructorClass;
        break;
      }
    }
    // Ne correspond pas à une couche geopf
    if (!isGeopfLayer) {
      return null;
    }
    const conf = (!Config.isConfigLoaded()) ? LayerConfig.getLayerConfig(options.catalogId) : null;
    const layer = new Constructor({
      layer: options.name,
      configuration: conf
    });
    this.readOptions(layer, options);
    return layer;
  }

  /**
   * 
   * @param {GeoportalWMS|GeoportalWMTS|GeoportalMapBox|GeoportalWFS} layer Couche de donnée
   * @param {Object} options Objet json (couche provenant du fichier .carte)
   * @override
   */
  readOptions(layer, options) {
    super.readOptions(layer, options);

    // Ajoute les éléments à la config
    layer.config.thumbnail = options.thumbnail || "default";
    layer.config.producer = options.producer || "";
    layer.config.catalogId = options.catalogId;

    // Options de configuration
    if (options.styleName && options.styleTitle && options.styleUrl) {
      layer.styleUrl = options.styleUrl;
      layer.styleName = options.styleName;
      layer.styleTitle = options.styleTitle;
      // Essaie de mettre le style correspondant
      try {
        layer.setStyleMapBox().then(() => {
          layer.setProperties({
            "title": layer.getSource()._title || layer.styleName || layer.styleTitle,
          });
        });
      } catch {
        console.warn("setStyleMapBox not implement on layer", layer)
      }
    }
  }

  /** 
   * Transforme une couche des extensions en objet json.
   * @param {GeoportalWMS|GeoportalWMTS|GeoportalMapBox|GeoportalWFS} layer Couche à écrire
   * @return {object} JSON layer
   * @override
   */
  write(layer) {
    let isGeopfLayer = false;
    let constructor = null;
    let name = null;
    for (let i = 0; i < GeopfExtensionsFormat.validConstructors.length; i++) {
      const [constructorName, constructorClass] = GeopfExtensionsFormat.validConstructors[i];
      // On garde les infos
      if (layer instanceof constructorClass) {
        isGeopfLayer = true;
        constructor = constructorClass;
        name = constructorName;
        break;
      }
    }
    // Ne correspond pas à une couche geopf
    if (!isGeopfLayer) {
      return null;
    }

    const options = this.writeOptions(layer, name);
    return options;
  }

  /**
   * Override de la méthode writeOptions pour ne
   * 
   * @param {GeoportalWMS|GeoportalWMTS|GeoportalMapBox|GeoportalWFS} layer Couche à écrire
   * @param {String} type Type de la couche
   * @override
   */
  writeOptions(layer, name) {
    const result = super.writeOptions(layer);
    const config = layer.config;
    // Ajoute les éléments manquants au résultat

    Object.assign(result, {
      title: config.title,
      type: name,
      name: config.name,
      thumbnail: config.thumbnail,
      catalogId: config.catalogId,
      producer: config.producer,
    });
    // Ajout du style s'il y'en a un
    if (layer.styleName && layer.styleTitle && layer.styleUrl) {
      Object.assign(result, {
        styleName: layer.styleName,
        styleTitle: layer.styleTitle,
        styleUrl: layer.styleUrl,
      })
    }
    return result;
  }
}

export default GeopfExtensionsFormat;