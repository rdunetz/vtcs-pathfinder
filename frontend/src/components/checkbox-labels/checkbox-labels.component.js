import * as React from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

export default function CheckboxLabels() {
  return (
    <FormGroup>
      <FormControlLabel control={<Checkbox />} label="Core CS" />
      <FormControlLabel control={<Checkbox />} label="Mathematics" />
      <FormControlLabel control={<Checkbox />} label="Electives" />
      <FormControlLabel control={<Checkbox />} label="Pathways" />
    </FormGroup>
  );
}
