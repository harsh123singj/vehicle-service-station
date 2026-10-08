export const verifyRegistration = async (vehicle) => {
    // Simulated external registration service

    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!vehicle) {
        return {
            status: "FAILED",
            referenceNumber: null,
            responseData: {
                source: "SIMULATED_REGISTRATION_SERVICE",
                reason: "Vehicle not found"
            },
            errorMessage: "Vehicle not found"
        };
    }

    return {
        status: "VERIFIED",

        referenceNumber:
            `REG-${vehicle.id}-${Date.now()}`,

        responseData: {
            source: "SIMULATED_REGISTRATION_SERVICE",
            registrationNumber:
                vehicle.registrationNumber,
            vehicleType:
                vehicle.vehicleType,
            make:
                vehicle.make,
            model:
                vehicle.model,
            valid: true
        },

        errorMessage: null
    };
};


export const verifyCompliance = async (vehicle) => {
    // Simulated external compliance service

    await new Promise((resolve) => setTimeout(resolve, 400));

    if (!vehicle) {
        return {
            status: "FAILED",
            referenceNumber: null,
            responseData: {
                source: "SIMULATED_COMPLIANCE_SERVICE",
                reason: "Vehicle not found"
            },
            errorMessage: "Vehicle not found"
        };
    }

    return {
        status: "VERIFIED",

        referenceNumber:
            `COMP-${vehicle.id}-${Date.now()}`,

        responseData: {
            source: "SIMULATED_COMPLIANCE_SERVICE",
            certificationStatus: "VALID",
            complianceStatus: "COMPLIANT",
            valid: true
        },

        errorMessage: null
    };
};