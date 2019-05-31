import { Fragments, Fragment } from "./fragments";
import { Events, Event, Include, Inline, Wildcard, WildcardEntry } from "./events";
import { Property } from "./common-properties";
import * as keywords from './keywords';

export function merge(target: Fragments | Events, source: Fragments | Events) {
    for(const item of source.dataPoints) {
        const found = target.dataPoints.find((f) => {
            return f.name == item.name;
        });
        // We combine their properties together if the event already exists
        if (found) {
            found.properties = found.properties.concat(item.properties);
        } else {
            target.dataPoints.push(item);
        }
    }
}

// Searches the object for an event or fragment of the specific name 
// If found returns, if not found creates it, places it in the array, and then returns
export function findOrCreate(searchTarget: Events | Fragments, name: string) {
    let found = searchTarget.dataPoints.find((item) => {
        return item.name === name;
    });
    if (!found) {
        if (searchTarget instanceof Events) {
            found = new Event(name);
        } else {
            found = new Fragment(name);
        }
    }
    searchTarget.dataPoints.push(found);
    return found;
}

export function mergeWildcards(wildcard: any, target: Event | Fragment) {
    let wildCard = target.properties.find((item) => {
        return item instanceof Wildcard;
    }) as Wildcard;
    // if we don't have a wildcard yet we make one
    if (!wildCard) {
        wildCard = new Wildcard();
        target.properties.push(wildCard);
    }
    wildCard.entries.push(new WildcardEntry(wildcard[0][keywords.prefix], wildcard[0][keywords.classification]));
}

export function populateProperties(properties: any, target: Event | Fragment, applyEndpoints = false, includeMeasurements = false) {
    for (const propertyName in properties) {
        const currentProperty = properties[propertyName];
        if (propertyName === keywords.include) {
            target.properties.push(new Include(currentProperty));
        } else if (currentProperty[keywords.inline]) {
            // We consider the property name the inline name so when we resolve we can do prop.Inline for the new properties
            target.properties.push(new Inline(propertyName, currentProperty[keywords.inline]));
        } else if (propertyName === keywords.wildcard) {
            mergeWildcards(currentProperty, target);
        } else {
            const prop = new Property(propertyName, currentProperty.classification, currentProperty.purpose);
            if (applyEndpoints) {
                const endpoint = currentProperty.endpoint ? currentProperty.endpoint : 'none';
                prop.endPoint = endpoint;
            }
            if (includeMeasurements && currentProperty.isMeasurement) {
                prop.isMeasurement = currentProperty.isMeasurement;
            }
            target.properties.push(prop);
        }
    }
}