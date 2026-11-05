import {textPrinciples} from './principles-text.mjs';
import {mediaPrinciples} from './principles-media.mjs';
import {dailyTechnicalDetails} from './principles-daily.mjs';

export const principles=Object.fromEntries(
  Object.entries({...textPrinciples,...mediaPrinciples}).map(([id,content])=>[id,{...content,...dailyTechnicalDetails[id]}]),
);
