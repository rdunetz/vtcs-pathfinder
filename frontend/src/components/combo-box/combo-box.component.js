import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

export default function ComboBox(params) {

    const { options } = params;

    return (
        <Autocomplete
            disablePortal
            getOptionLabel={(option) => option.name}
            options={options}
            sx={{ maxWidth: 300, marginBottom: 4 }}
            renderInput={(params) => <TextField {...params} label="Plans" />}
        />
    );
}