import {textPrinciples} from './principles-text.mjs';
import {mediaPrinciples} from './principles-media.mjs';
import {dailyTechnicalDetails} from './principles-daily.mjs';
import {playfulPrinciples} from './principles-playful.mjs';

export const principles=Object.fromEntries(
  Object.entries({...textPrinciples,...mediaPrinciples,...playfulPrinciples}).map(([id,content])=>[id,{...content,...dailyTechnicalDetails[id]}]),
);
