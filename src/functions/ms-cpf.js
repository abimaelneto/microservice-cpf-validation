const { app } = require('@azure/functions');

function isValidCPFFormat(cpf) {
    const cpfClean = cpf.replace(/[^\d]/g, '');
    return cpfClean.length === 11;
}

function hasAllSameDigits(cpf) {
    return cpf.split('').every(c => c === cpf[0]);
}

function calculateVerificationDigit(cpf, position) {
    const slice = cpf.slice(0, position);
    let sum = 0;
    let multiplier = position + 1;

    for(let i = 0; i < slice.length; i++) {
        sum += parseInt(slice[i]) * multiplier;
        multiplier--;
    }

    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
}

function validateCPF(cpf) {
    // Remove non-digits and ensure it has 11 digits
    const cpfClean = cpf.replace(/[^\d]/g, '');
    
    if (!isValidCPFFormat(cpfClean)) {
        return false;
    }

    if (hasAllSameDigits(cpfClean)) {
        return false;
    }

    // Validate first verification digit
    const digit1 = calculateVerificationDigit(cpfClean, 9);
    if (digit1 !== parseInt(cpfClean[9])) {
        return false;
    }

    // Validate second verification digit
    const digit2 = calculateVerificationDigit(cpfClean, 10);
    if (digit2 !== parseInt(cpfClean[10])) {
        return false;
    }

    return true;
}

app.http('ms-cpf', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            if (request.method === 'POST') {
                const body = await request.json();
                const cpf = body.cpf;

                if (!cpf) {
                    return {
                        status: 400,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        jsonBody: {
                            error: 'CPF is required in the request body'
                        }
                    };
                }

                const isValid = validateCPF(cpf);
                
                if (!isValid) {
                    return {
                        status: 400,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        jsonBody: {
                            error: 'Invalid CPF'
                        }
                    };
                }

                return {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    jsonBody: {
                        cpf: cpf,
                        isValid: true
                    }
                };
            }

            return {
                status: 405,
                headers: {
                    'Content-Type': 'application/json'
                },
                jsonBody: {
                    error: 'Method not allowed'
                }
            };
        } catch (error) {
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                },
                jsonBody: {
                    error: 'Internal server error'
                }
            };
        }
    }
});
