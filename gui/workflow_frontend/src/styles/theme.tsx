import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#e6f1ff',
      100: '#c0d7f7',
      200: '#99bdef',
      300: '#71a3e7',
      400: '#4a8adf',
      500: '#3070c6',
      600: '#25579b',
      700: '#183e70',
      800: '#0c2547',
      900: '#020d1f',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.900',
        color: 'white',
        margin: 0,
        padding: 0,
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'normal',
        borderRadius: 'md',
      },
      defaultProps: {
        colorScheme: 'brand',
        variant: 'ghost',
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: 'medium',
        letterSpacing: 'tight',
      },
    },
    Modal: {
      parts: ['dialog', 'header', 'body', 'footer', 'closeButton', 'overlay'],
      baseStyle: {
        dialog: {
          bg: 'gray.800',
          color: 'white',  
          borderRadius: 'md',
          boxShadow: 'xl',
        },
        overlay: {
          bg: 'blackAlpha.700', 
        },
        header: {
          fontWeight: 'bold',
          borderBottomWidth: '1px',
          borderColor: 'gray.700',
        },
        body: {
        },
        footer: {
          borderTopWidth: '1px',
          borderColor: 'gray.700',
        },
        closeButton: {
          color: 'gray.400',
          _hover: {
            color: 'white',
            bg: 'whiteAlpha.100',
          }
        }
      }
    }
  },
});

export default theme;
